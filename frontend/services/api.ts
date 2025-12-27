import { User } from '../types';

const API_URL = "http://localhost:8000";

export const BackendAPI = {
    async getChallenge(): Promise<string> {
        try {
            const res = await fetch(`${API_URL}/auth/challenge`, { method: "POST" });
            if (!res.ok) throw new Error("Failed to get security challenge");
            const data = await res.json();
            return data.nonce;
        } catch (err) {
            console.error(err);
            throw new Error("Backend Unavailable");
        }
    },

    async registerUser(username: string, role: string): Promise<User> {
        const formData = new FormData();
        formData.append("username", username);
        formData.append("role", role);

        const res = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            body: formData
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Registration Failed");
        }
        return res.json();
    },

    async enrollFace(username: string, imageBlob: Blob): Promise<{ success: boolean; message: string }> {
        const formData = new FormData();
        formData.append("username", username);
        formData.append("image", imageBlob, "enrollment.jpg");

        const res = await fetch(`${API_URL}/auth/enroll`, {
            method: "POST",
            body: formData
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.detail || "Enrollment Failed");
        }
        return data;
    },

    async verifyFace(imageBlob: Blob): Promise<{ authorized: boolean; similarity: number; message: string; user?: User }> {
        // 1. Get Nonce (Anti-Replay)
        const nonce = await this.getChallenge();

        // 2. Send Request
        const formData = new FormData();
        formData.append("image", imageBlob, "verify.jpg");
        formData.append("nonce", nonce);

        const res = await fetch(`${API_URL}/auth/verify`, {
            method: "POST",
            body: formData
        });

        const data = await res.json();
        // Even if 403/400, we might want to return the message. 
        // But usually fetch doesn't throw on 4xx.
        // If it's a "known" failure (like liveness), the backend returns 200 with authorized=False usually? 
        // My backend returns authorized=False in JSON for logic failures, but HTTP exceptions for errors.

        if (!res.ok) {
            // If HTTP error (like 403 Replay, or 400 Bad Request), throw it
            throw new Error(data.detail || "Verification Error");
        }

        return data;
    },
    async getLogs(): Promise<any[]> {
        const res = await fetch(`${API_URL}/api/logs`);
        if (!res.ok) throw new Error("Failed to fetch logs");
        return res.json();
    },

    async logEvent(entry: { eventType: string; severity: string; details: string; username?: string; sourceIp: string }): Promise<void> {
        try {
            await fetch(`${API_URL}/api/logs/external`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(entry)
            });
        } catch (e) {
            console.warn("Failed to push audit log:", e);
        }
    },

    async executeThreatSimulation(attackType: string, targetUser: string, securityLevel: string): Promise<{ success: boolean; message: string; attackType: string }> {
        const res = await fetch(`${API_URL}/api/threat-sim/execute`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ attackType, targetUser, securityLevel })
        });
        if (!res.ok) throw new Error("Simulation Endpoint Failed");
        return res.json();
    },

    async getMetrics(): Promise<{ total_auths_1h: number; access_denied_24h: number; active_threats: number; threats_detected_24h: number }> {
        const res = await fetch(`${API_URL}/api/metrics`);
        if (!res.ok) throw new Error("Failed to fetch metrics");
        return res.json();
    },

    async getUsers(): Promise<User[]> {
        const res = await fetch(`${API_URL}/api/users`);
        if (!res.ok) throw new Error("Failed to fetch users");
        return res.json();
    }
};
