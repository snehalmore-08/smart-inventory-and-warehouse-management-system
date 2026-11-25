# Smart Inventory and Warehouse Management System

## Project Overview
The Smart Inventory and Warehouse Management System is designed to simplify inventory tracking and warehouse operations. It combines software-based inventory management with hardware-assisted product identification and weight monitoring.

## Key Features
- Product Management
- Stock In and Stock Out Management
- RFID-Based Product Identification
- Weight Measurement Integration
- Inventory Dashboard
- Low Stock Alerts
- Warehouse Analytics
- Transaction Audit Logs
- Hardware Simulation

## Technologies Used

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Python
- FastAPI

### Database
- MySQL

### Server
- Uvicorn

### Hardware
- ESP32
- RFID RC522
- Load Cell
- HX711

## System Architecture
Frontend → FastAPI Backend → MySQL Database

Hardware → ESP32 → Wi-Fi/API → Backend → Database → Dashboard

## Project Documentation
The `docs` folder contains project architecture and hardware integration documentation.

## Project Status
Software development and simulator-based integration are completed. Physical hardware integration and final verification with the actual components remain pending.