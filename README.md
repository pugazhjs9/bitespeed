# Bitespeed Backend Task: Identity Reconciliation

This repository contains the implementation of the **Bitespeed Backend Task** for identity reconciliation. The goal is to identify and link multiple contacts of the same customer using shared attributes like email or phone number. This backend service is built using **Node.js** with **Prisma ORM** and a **MySQL database**.

---

## Problem Statement

FluxKart.com uses Bitespeed to collect customer contact details for a personalized experience. However, due to customers like Doc using multiple email addresses and phone numbers for purchases, it becomes challenging to link these details to a single identity.

This service provides an endpoint `/identify` to reconcile such identities, ensuring accurate and consolidated customer data.

---

## Hosted Service

**Base URL:** [https://bitespeed-k4x7.onrender.com](https://bitespeed-k4x7.onrender.com/)

### Example API Endpoint

- **POST** `/identify`

---

## Features

- Identify and link customer contact details based on shared email or phone number.
- Maintain a "primary" contact for each customer, with all linked secondary contacts.
- Automatically handle edge cases like linking new details or merging existing data.

---

## Tech Stack

- **Backend Framework:** Node.js
- **ORM:** Prisma
- **Database:** MySQL (hosted on [Aiven](https://aiven.io/))
- **Hosting:** Render ([Service Link](https://bitespeed-k4x7.onrender.com/))

---

## API Documentation

### **POST /identify**

### Request Body

```json
{
  "email": "example@domain.com", // optional
  "phoneNumber": "1234567890"   // optional
}

```

> At least one of email or phoneNumber is required.
> 

### Response

### If a new contact is created:

```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["example@domain.com"],
    "phoneNumbers": ["1234567890"],
    "secondaryContactIds": []
  }
}

```

### If an existing contact is identified or linked:

```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["primary@example.com", "secondary@example.com"],
    "phoneNumbers": ["1234567890", "9876543210"],
    "secondaryContactIds": [2, 3]
  }
}

```

### If input is invalid:

```json
{
  "error": "Email or phone number is required!"
}

```

### Status Codes

- `200`: Existing contact data returned.
- `201`: New contact created.
- `400`: Invalid input (missing email or phone number).
- `500`: Internal server error.

---

## Project Structure

```
.
├── index.js                # Main application entry point
├── prisma/
│   ├── schema.prisma       # Prisma schema definition
├── package.json            # Project dependencies and scripts
└── README.md               # Project documentation

```

---

## Setup Instructions

1. Clone the repository:
    
    ```bash
    git clone https://github.com/pugazhjs9/bitespeed.git
    cd bitespeed
    
    ```
    
2. Install dependencies:
    
    ```bash
    npm install
    
    ```
    
3. Configure the database:
    - Create a `.env` file and add your **MySQL** connection string:
        
        ```
        DATABASE_URL="mysql://<user>:<password>@<host>:<port>/<database>"
        
        ```
        
4. Initialize the Prisma schema:
    
    ```bash
    npx prisma generate
    npx prisma db push
    
    ```
    
5. Start the server:
    
    ```bash
    npm start
    
    ```
    
6. Access the service at [http://localhost:3000](http://localhost:3000/).

---

## Deployment

The service is hosted on [Render](https://render.com/).

Deployed endpoint: [https://bitespeed-k4x7.onrender.com](https://bitespeed-k4x7.onrender.com/)

---

## Database Design

**Table:** `Contact`

| Column | Type | Description |
| --- | --- | --- |
| `id` | Integer | Unique identifier for the contact |
| `phoneNumber` | String (nullable) | Phone number associated with the contact |
| `email` | String (nullable) | Email address associated with the contact |
| `linkedId` | Integer (nullable) | ID of the primary contact (if secondary) |
| `linkPrecedence` | String | Indicates if the contact is "primary" or "secondary" |
| `createdAt` | DateTime | Timestamp when the contact was created |
| `updatedAt` | DateTime | Timestamp when the contact was last updated |

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
