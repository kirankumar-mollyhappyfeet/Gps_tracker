# Vehicle GPS-Based Service Order Time Tracking System

## Overview

Build a GPS-based tracking system for a home-service/utility management platform(plumbing). Unlike mobile-based GPS tracking, this system uses a dedicated GPS tracker installed in each service vehicle.

The GPS device continuously sends the vehicle's location to the backend.
The system automatically matches the vehicle's location with assigned
service orders to determine when a technician arrives at or leaves a
customer location.

The technician is **not responsible for starting or stopping GPS
tracking**. GPS tracking happens automatically through the vehicle.

## Objectives

- Automatically track technician arrival and departure using the
vehicle GPS.
- Reduce manual time entry.
- Calculate actual time spent at customer locations.
- Allow technicians to review and correct recorded times when
necessary.
- Maintain an audit history of all manual changes.
- Support large-scale deployments.

 



Note:add this thing also whenever they receive 2to 3 or more service order from same location then techicne need to update the time of each order they spent (for examplr in same building if we got 3 oders ,so the technician will need to update this oder taken this much time and this order takrn this much time etc

## System Components



### Vehicle GPS Tracker

Each vehicle contains a GPS device that continuously sends: - Vehicle
ID - Latitude - Longitude - Timestamp - Speed (optional) - Ignition
status (optional)

### Service Orders

Each service order contains: - Service Order ID - Customer - Customer
Address - GPS Coordinates - Scheduled Time - Assigned Technician -
Assigned Vehicle - Job Status

### GPS Processing

The backend: 1. Receives GPS updates. 2. Identifies the assigned
vehicle. 3. Matches it with the active service order. 4. Checks whether
the vehicle is inside the customer's geofence.

### Automatic Arrival Detection

When the vehicle enters the geofence: - Record arrival time. - Record
GPS coordinates. - Update status to **Arrived**.

### Automatic Departure Detection

When the vehicle exits the geofence: - Record departure time. -
Calculate service duration.

### Technician Portal

Technicians can: - View assigned service orders. - View automatically
recorded arrival/departure times. - Review service duration. - Add
notes. - Upload attachments (optional). - Complete the service order. -
Request or perform time corrections (based on permissions).

### Manual Time Adjustment

Editable fields: - Arrival Time - Departure Time - Service Duration

Every edit stores: - Previous value - New value - Reason - Edited by -
Timestamp

### Admin Features

Admins can: - View live vehicle locations. - Review GPS history. -
Review manual edits. - Configure geofence radius. - Generate reports.

## Workflow

1. Assign vehicle to service order.
2. GPS tracker continuously sends location.
3. Backend matches GPS with customer location.
4. Vehicle enters geofence.
5. Arrival is recorded automatically.
6. Technician performs service.
7. Vehicle exits geofence.
8. Departure is recorded automatically.
9. Duration is calculated.
10. Technician reviews and updates data if necessary.
11. Admin reviews changes.



## Scalability

The solution should support: - Hundreds of thousands of vehicles. -
Continuous GPS updates. - Large numbers of technicians. - Real-time
dashboards. - Historical GPS records.





## Key Principle

The vehicle GPS tracker is the source of truth for location tracking.
Technicians only review, validate, complete service orders, and make
justified corrections when required.