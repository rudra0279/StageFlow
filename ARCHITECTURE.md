# StagePilot — Backend Foundation & Architecture Guide

> Please refer to the complete architecture and contract specification in:
> [server/ARCHITECTURE.md](file:///d:/StageFlow/server/ARCHITECTURE.md)

---

## Quick Reference Summary

- **Backend Location**: `server/`
- **Frontend Location**: `client/`
- **Port**: `5000` (Backend API & Socket.IO), `5173` (Frontend Vite)
- **Health Check**: `GET /api/health` ➔ `{"success": true, "message": "StagePilot backend is running"}`
- **Test Suite**: `node server/src/utils/test_live_api.js` (12/12 test suites passing)
- **Default Credentials**:
  - Organizer: `organizer@stagepilot.io` / `password123`
  - Anchor: `anchor@stagepilot.io` / `password123`

For detailed endpoint contracts, schemas, Socket.IO event catalog, and developer instructions, see [server/ARCHITECTURE.md](file:///d:/StageFlow/server/ARCHITECTURE.md).
