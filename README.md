# Smart Inventory and Warehouse Management System

An intelligent inventory and warehouse management solution that combines software, database management, and IoT-based hardware monitoring to improve stock tracking and inventory control.

## Project Overview

The Smart Inventory and Warehouse Management System is designed to reduce manual inventory work and provide better visibility of stock levels, product movements, and reorder requirements.

The system uses RFID technology for product identification, a load cell with HX711 for physical weight measurement, and ESP32 for hardware data communication.

## Key Features

- Dashboard with inventory statistics.
- Product management (Add, Edit, Delete, Search).
- Stock In and Stock Out management.
- RFID-based product identification.
- Physical weight monitoring using Load Cell and HX711.
- Low-stock alerts and reorder-level monitoring.
- Inventory analytics and audit logs.
- Database-backed inventory records.

## Technologies Used

### Software
- Python
- FastAPI
- HTML, CSS, JavaScript
- MySQL

### Hardware
- ESP32
- RFID RC522
- Load Cell (10 kg)
- HX711 Load Cell Amplifier

## Project Structure

```text
SmartInventorySystem/
│
├── backend/
│   └── Python FastAPI backend
│
├── frontend/
│   ├── index.html
│   ├── css/
│   └── js/
│
├── hardware/
│   └── ESP32 hardware source code
│
└── docs/
    ├── Hardware_Integration_Flow.txt
    └── Software_Architecture.txt
```

## System Modules

1. Dashboard
2. Product Management
3. Stock In / Stock Out
4. RFID Hardware Simulator
5. Inventory Analytics
6. Audit Logs
7. Low Stock Alerts

## Project Objective

To develop an intelligent inventory management system that improves stock accuracy, simplifies warehouse operations, monitors physical stock, and supports better inventory decisions.

## Project Status

Software implementation and simulator-based integration are completed. Physical hardware integration is part of the project implementation.

## Repository Contents

This repository contains the software source code, hardware-related files, project documentation, and system architecture details.

## Developed For

Academic Capstone Project
