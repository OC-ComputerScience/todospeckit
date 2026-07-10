# C4 Level 4 — Deployment

Two machines: the **User PC** runs only the browser; the **Web Server** hosts Apache (static Frontend SPA), the Node app runtime (Backend API), and MySQL.

```mermaid
C4Deployment
title Todo Speckit — Deployment (User PC + Web Server)

UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")

Deployment_Node(userPc, "User PC", "Student / end-user computer") {
    Deployment_Node(browser, "Web Browser", "Chrome / Edge / Firefox") {
        Container(spa, "Frontend SPA", "Vue 3, Vuetify, axios", "Runs in the browser. Loaded from Apache; calls Backend API with Bearer JWT.")
    }
}

Deployment_Node(webServer, "Web Server", "Classroom or CI deploy host") {
    Deployment_Node(apache, "Apache", "HTTP / HTTPS static hosting") {
        Container(staticAssets, "Static SPA assets", "Built Vue dist + .htaccess", "Served to the browser; not the running app.")
    }

    Deployment_Node(runtime, "App Runtime", "Node.js 20+") {
        Container(api, "Backend API", "Express, Sequelize", "REST under /todo/. Listens on app port (e.g. 3200).")
    }

    Deployment_Node(data, "Database Server", "MySQL") {
        ContainerDb(db, "Database", "MySQL", "users, sessions, lists, todos.")
    }
}

Rel(spa, staticAssets, "Loaded from", "HTTPS")
Rel(spa, api, "JSON API", "Bearer JWT")
Rel(api, db, "SQL", "TCP")

UpdateRelStyle(spa, staticAssets, $offsetY="-30")
UpdateRelStyle(spa, api, $offsetY="-30")
UpdateRelStyle(api, db, $offsetY="-30")
```

## Typical ports

| Location | Service | Port |
|----------|---------|------|
| User PC | Browser | — |
| Web Server | Apache (SPA) | `80` / `443` |
| Web Server | Backend API | `3200` (or reverse-proxied) |
| Web Server | MySQL | `3306` |

## Notes

- **Local XAMPP classroom:** User PC and Web Server are often the **same** physical machine; the diagram still shows the logical split (browser vs server processes).
- **CI deploy** (`.github/workflows/deploy.yml`): builds SPA + backend, SSH-deploys static files and Node app to the Web Server; DB credentials via secrets.

**Related:** [ADR-0001](../adr/0001-client-server-multi-user-architecture.md) · [c4-container.md](./c4-container.md) · `.github/workflows/deploy.yml`
