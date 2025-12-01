# Network Configuration Guide

## Quick Fix for Connection Timeouts

If you're getting timeout errors when the mobile app tries to connect to the backend:

### Step 1: Find Your Current IP Address

Run this in PowerShell:
```powershell
ipconfig | Select-String -Pattern "IPv4"
```

Look for the IP address of your **Wi-Fi** or **Ethernet** adapter (usually starts with `192.168.x.x`).

### Step 2: Update the Mobile App Configuration

Edit: `FindAssure/src/config/api.config.ts`

Update the `BACKEND_IP` to match your current IP:
```typescript
export const API_CONFIG = {
  BACKEND_IP: '192.168.43.106', // ⚠️ UPDATE THIS
  BACKEND_PORT: 5000,
  REQUEST_TIMEOUT: 30000,
};
```

### Step 3: Restart the Backend Server

The backend should automatically restart if you're using `npm run dev`.

### Step 4: Test the Connection

Run this in PowerShell to verify the backend is accessible:
```powershell
curl http://YOUR_IP:5000/health
```

Replace `YOUR_IP` with your actual IP address.

## Different Scenarios

### Testing on Android Emulator
- Use IP: `10.0.2.2`
- This is a special alias to localhost on the host machine

### Testing on iOS Simulator
- Use IP: `localhost` or `127.0.0.1`
- Simulator shares the same network as your Mac

### Testing on Physical Device
- Both phone and computer must be on the **same Wi-Fi network**
- Use your computer's local IP address (e.g., `192.168.43.106`)
- Make sure your firewall allows connections on port 5000

## Firewall Configuration (Windows)

If still having issues, allow Node.js through Windows Firewall:

1. Open Windows Defender Firewall
2. Click "Allow an app or feature through Windows Defender Firewall"
3. Find "Node.js" and ensure both Private and Public are checked
4. If not listed, click "Allow another app" and browse to `node.exe`

## Common Issues

### Error: "timeout of 30000ms exceeded"
- Backend server is not running
- IP address has changed
- Firewall is blocking the connection
- Phone and computer are on different networks

### Error: "Network request failed"
- Check if backend is running: `npm run dev` in Backend folder
- Verify IP address is correct
- Test with: `curl http://YOUR_IP:5000/health`

## Pro Tip

Your IP address changes when you:
- Switch between Wi-Fi networks
- Disconnect/reconnect to Wi-Fi
- Restart your router
- Use VPN

Always check your IP address if you get connection errors after these events!
