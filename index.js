const express = require("express");
const bodyParser = require("body-parser");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();

app.use(bodyParser.json());

app.post("/identify", async (req, res) => {
    const { email, phoneNumber } = req.body;

    // Validate input - either email or phone number must be provided
    if (!email && !phoneNumber) {
        return res.status(400).json({ error: "Email or phone number is required!" }); // Bad Request
    }

    try {
        // Step 1: Find existing contacts by email or phone number
        const contacts = await prisma.contact.findMany({
            where: {
                OR: [
                    { email },
                    { phoneNumber },
                ],
            },
        });

        if (contacts.length === 0) {
            // Step 2: No existing contact found, create a new primary contact
            const newContact = await prisma.contact.create({
                data: {
                    email,
                    phoneNumber,
                    linkPrecedence: "primary", // Mark as primary
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });

            // Return newly created contact with primary details
            return res.status(201).json({ // Created
                contact: {
                    primaryContactId: newContact.id,
                    emails: [newContact.email].filter((email) => email !== null),
                    phoneNumbers: [newContact.phoneNumber].filter((phoneNumber) => phoneNumber !== null),
                    secondaryContactIds: [],
                },
            });
        } else {
            // Step 3: Existing contacts found, process them

            // Sort contacts by ID, assuming the smallest ID is the primary
            contacts.sort((a, b) => a.id - b.id);
            const primaryContact = contacts[0]; // Primary contact is the first in the sorted list
            const updatedContacts = []; // Track updated secondary contacts

            // Step 4: Update all non-primary contacts to secondary and link them to the primary contact
            for (const contact of contacts) {
                if (contact.id !== primaryContact.id) {
                    if (contact.linkPrecedence !== "secondary" || contact.linkedId !== primaryContact.id) {
                        // Update contact as secondary and link to primary
                        await prisma.contact.update({
                            where: { id: contact.id },
                            data: {
                                linkPrecedence: "secondary",
                                linkedId: primaryContact.id,
                                updatedAt: new Date(),
                            },
                        });
                        updatedContacts.push(contact.id); // Add to secondary contact list
                    }
                }
            }

            // Step 5: Collect all unique emails and phone numbers from the contact list
            const emailSet = new Set(contacts.map((c) => c.email).filter((email) => email !== null));
            const phoneNumberSet = new Set(contacts.map((c) => c.phoneNumber).filter((phoneNumber) => phoneNumber !== null));

            // Step 6: Check if both the given email and phone number are already linked
            if (emailSet.has(email) && phoneNumberSet.has(phoneNumber)) {
                // Both email and phone number are already linked, return existing data
                return res.status(200).json({ // OK
                    contact: {
                        primaryContactId: primaryContact.id,
                        emails: Array.from(emailSet),
                        phoneNumbers: Array.from(phoneNumberSet),
                        secondaryContactIds: updatedContacts,
                    },
                });
            }

            // Step 7: Create a new secondary contact if the email or phone number is not already linked
            const newSecondary = await prisma.contact.create({
                data: {
                    email,
                    phoneNumber,
                    linkPrecedence: "secondary", // Mark as secondary
                    linkedId: primaryContact.id, // Link to primary contact
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });

            // Add new email and phone number to the sets
            emailSet.add(email);
            phoneNumberSet.add(phoneNumber);

            // Return updated contact data
            return res.status(201).json({ // Created
                contact: {
                    primaryContactId: primaryContact.id,
                    emails: Array.from(emailSet),
                    phoneNumbers: Array.from(phoneNumberSet),
                    secondaryContactIds: [...updatedContacts, newSecondary.id],
                },
            });
        }
    } catch (error) {
        // Step 8: Handle server errors
        console.error(error);
        return res.status(500).json({ error: "Internal server error!" }); // Internal Server Error
    }
});

// Server setup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
