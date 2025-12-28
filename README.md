# 🔐 Access Control System

A **full-stack biometric access control platform** with **face authentication**, **audit logging**, **threat simulation**, and a **SOC-style security dashboard**.

Built with **FastAPI (Python)** and **React + TypeScript (Vite)**, using **OpenCV + ArcFace** for real biometric verification.

---

## ✨ Features

### 🔍 Biometric Authentication

* Face authentication using **OpenCV + ArcFace (ONNX)**
* Secure enrollment & verification flows
* **Enrollment Security**: Prevents overwrite of existing biometrics.
* **Geometric Quality Controls**: Enforces face centrality, minimum size, and full visibility (no cut-offs).
* Server-side liveness checks (blur, quality, glare)
* Cosine similarity–based matching
* No client-side biometric decisions

### 📜 Audit Logging

* Backend-driven, append-only audit logs
* Tracks:

  * Registration
  * Enrollment
  * Verification success / failure
  * Access granted / denied
  * Threat detections
* Source IP resolved server-side

### 🛡️ Threat Simulation

* Backend-driven adversary emulation
* Simulated attack vectors:

  * Replay attack
  * Session hijacking
  * Liveness bypass
  * Injection attempts
* Defense profiles (LOW / HIGH)
* Forensic logs + audit trail

### 📊 Security Operations Dashboard

* Live security metrics
* Authentication statistics
* Threat detection counters
* Real-time SOC-style views

---

## ⚙️ Prerequisites

### Backend

* Python **3.9 – 3.10** (recommended)
* pip
* Virtual environment support

### Frontend

* Node.js **18+**
* npm

---

## 🚀 How to Run the Project

### 1️⃣ Clone the repository

```bash
git clone https://github.com/marouanetich/access-control-system.git
cd access-control-system
```

---

### 2️⃣ Backend Setup (FastAPI)

#### Create & activate virtual environment

**Windows**

```bash
python -m venv venv
venv\Scripts\activate
```

**macOS / Linux**

```bash
python3 -m venv venv
source venv/bin/activate
```

#### Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

---

### 3️⃣ Download Required Models

Download and place inside `backend/models/`:

* `w600k_r50.onnx` (ArcFace)
* `face_detection_yunet_2023mar.onnx`

👉 **Download from:**

https://github.com/opencv/opencv_zoo/blob/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx  
https://huggingface.co/maze/faceX/blob/e010b5098c3685fd00b22dd2aec6f37320e3d850/w600k_r50.onnx

Final structure:

```
backend/models/
├─ w600k_r50.onnx
└─ face_detection_yunet_2023mar.onnx
```

### 4️⃣ Start Backend

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend URLs:

* API: [http://localhost:8000](http://localhost:8000)

---

### 5️⃣ Frontend Setup (React)

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

* [http://localhost:3000](http://localhost:3000)

---

### 6️⃣ Presentation Setup (Optional)

To run the presentation slides:

```bash
cd presentation
npm install
npm run dev
```

Presentation URL:

* [http://localhost:5173](http://localhost:5173)

The presentation will automatically enter fullscreen mode on first user interaction. Use arrow keys or navigation controls to navigate between slides.

---

## 🔐 Security Design Notes

* All biometric processing is **server-side**
* Only embeddings are stored (no raw images)
* Client cannot forge audit logs or source IPs
* Threat simulation is **safe & sandboxed**
* Designed for SOC / blue-team workflows

---

## 🧪 Optional Checks

Test backend health:

```bash
curl http://localhost:8000/health
```

---
