import mmap
import ctypes
import serial
import time
import socketio
import threading

# ============================================
# 🔧 ECOSCORER CLOUD CONFIG - CHANGE THESE!
# ============================================

# Cloud URL (after deploying to Railway)
# Example: "https://ecoscorer-production.up.railway.app"
SERVER_URL = "https://ecoscorer-production.up.railway.app"

# Your EcoScorer account info
YOUR_USER_ID = 3             # ← Your user ID from registration
YOUR_EMAIL = "sri@gmail.com"
YOUR_NAME = "sri"

# Serial port for ESP32 (set to None to disable)
SERIAL_PORT = "COM11"        # ← Your COM port, or None
SERIAL_BAUD = 115200

# ---------- PHYSICS STRUCT ----------
class SPageFilePhysics(ctypes.Structure):
    _fields_ = [
        ("packetId", ctypes.c_int),
        ("gas", ctypes.c_float),
        ("brake", ctypes.c_float),
        ("fuel", ctypes.c_float),
        ("gear", ctypes.c_int),
        ("rpms", ctypes.c_int),
        ("steerAngle", ctypes.c_float),
        ("speedKmh", ctypes.c_float),
    ]

# ---------- STATIC STRUCT ----------
class SPageFileStatic(ctypes.Structure):
    _fields_ = [
        ("smVersion", ctypes.c_wchar * 15),
        ("acVersion", ctypes.c_wchar * 15),
        ("carModel", ctypes.c_wchar * 33),
        ("track", ctypes.c_wchar * 33),
        ("playerName", ctypes.c_wchar * 33),
    ]

# ---------- READ FUNCTIONS ----------
def read_physics():
    try:
        mem = mmap.mmap(-1, ctypes.sizeof(SPageFilePhysics),
                        "Local\\acpmf_physics", access=mmap.ACCESS_READ)
        data = SPageFilePhysics.from_buffer_copy(mem)
        mem.close()
        return data
    except:
        return None

def read_static():
    try:
        mem = mmap.mmap(-1, ctypes.sizeof(SPageFileStatic),
                        "Local\\acpmf_static", access=mmap.ACCESS_READ)
        data = SPageFileStatic.from_buffer_copy(mem)
        mem.close()
        return data
    except:
        return None

# ============================================
# WEBSOCKET TO ECOSCORER CLOUD
# ============================================
sio = socketio.Client(reconnection=True, reconnection_attempts=0, reconnection_delay=2)
ws_connected = False

@sio.event
def connect():
    global ws_connected
    ws_connected = True
    print(f"\n✅ Connected to EcoScorer Cloud!")
    sio.emit('register_user', {'userId': YOUR_USER_ID, 'email': YOUR_EMAIL, 'name': YOUR_NAME})

@sio.event
def disconnect():
    global ws_connected
    ws_connected = False
    print("\n⚠️ Disconnected - reconnecting...")

@sio.event
def connect_error(data):
    global ws_connected
    ws_connected = False

def websocket_loop():
    global ws_connected
    while True:
        if not ws_connected:
            try:
                if not sio.connected:
                    sio.connect(SERVER_URL, wait_timeout=10)
            except Exception as e:
                print(f"🔴 Connection failed, retrying... ({str(e)[:50]})")
        time.sleep(5)

# Start WebSocket in background
threading.Thread(target=websocket_loop, daemon=True).start()

# ---------- SERIAL (OPTIONAL) ----------
ser = None
if SERIAL_PORT:
    try:
        ser = serial.Serial(SERIAL_PORT, SERIAL_BAUD, timeout=0.1)
        time.sleep(2)
        print(f"✅ Serial connected on {SERIAL_PORT}")
    except:
        print(f"⚠️ Serial not available on {SERIAL_PORT}")

# ---------- CAR STATE ----------
current_model = ""
car_id = 0
car_name = "Unknown"

def update_car():
    global current_model, car_id, car_name
    static = read_static()
    if not static:
        return
    model = static.carModel.strip()
    if model and model != current_model:
        current_model = model
        car_name = model.replace("_", " ").title()
        car_id = abs(hash(model)) % 65535
        print(f"\n🚗 Car: {car_name} (ID={car_id})")

print("=" * 60)
print("🏎️  EcoScorer - Assetto Corsa Bridge")
print(f"   Server: {SERVER_URL}")
print(f"   User: {YOUR_NAME} (ID: {YOUR_USER_ID})")
print("=" * 60)
print("\n🔌 Connecting to EcoScorer Cloud...")

# ---------- MAIN LOOP ----------
while True:
    update_car()

    ac = read_physics()
    if not ac:
        print("⏳ Waiting for Assetto Corsa...", end='\r')
        time.sleep(1)
        continue

    rpm = ac.rpms
    speed = ac.speedKmh
    throttle = ac.gas
    brake = ac.brake
    fuel = ac.fuel
    gear = ac.gear

    # Calculate derived values
    maf = rpm * throttle * 0.00008
    intake = 28 + throttle * 15
    coolant = min(95, 30 + rpm * 0.0003)

    # Send CAN frames (if serial connected)
    if ser:
        frames = {
            0x100: rpm,
            0x101: int(speed),
            0x102: int(throttle * 1000),
            0x103: int(brake * 1000),
            0x104: int(fuel * 1000),
            0x105: car_id,
            0x200: int(maf * 100),
            0x201: int(coolant * 10),
            0x202: int(intake * 10),
        }
        for cid, val in frames.items():
            msg = f"{cid:03X},{(val>>8)&0xFF:02X},{val&0xFF:02X}\n"
            ser.write(msg.encode())
        while ser.in_waiting:
            print("ESP32 →", ser.readline().decode(errors="ignore").strip())

    # Send to EcoScorer Cloud
    if ws_connected:
        sio.emit('telemetry_update', {
            "userId": YOUR_USER_ID,
            "userName": YOUR_NAME,
            "userEmail": YOUR_EMAIL,
            "carId": car_id,
            "carName": car_name,
            "speed": speed,
            "rpm": rpm,
            "throttlePos": throttle * 100,
            "brakePos": brake * 100,
            "fuel": fuel,
            "gear": gear,
            "maf": maf,
            "engineLoad": throttle * 80 + 20,
            "airIntake": intake,
            "coolantTemp": coolant,
            "brakeStatus": brake > 0.1,
            "timestamp": int(time.time() * 1000)
        })

    status = "🟢" if ws_connected else "🔴"
    print(f"{status} {car_name} | {speed:.0f}km/h | RPM={rpm} | Throttle={throttle*100:.0f}%", end='\r')
    
    time.sleep(0.1)
