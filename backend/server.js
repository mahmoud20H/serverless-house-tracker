import express from 'express';
import cors from 'cors';
import serverless from 'serverless-http';
import { v4 as uuidv4 } from 'uuid';
import { docClient } from './db.js';
import { ScanCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const app = express();
const PORT = process.env.PORT || 3000;
const HOUSES_TABLE = process.env.HOUSES_TABLE_NAME || 'Houses';
const BROKERS_TABLE = process.env.BROKERS_TABLE_NAME || 'Brokers';

app.use(cors());
app.use(express.json());

// Helper function to validate House Enums
function validateHouse(data) {
    const validStatuses = ['INBOX', 'VERIFIED', 'VISITED', 'DECISION'];
    const validPriceTiers = [
        'UNDER_2M_NO_INSTALLMENTS',
        'UNDER_2M_WITH_INSTALLMENTS',
        'UNDER_3M_NO_INSTALLMENTS',
        'UNDER_3M_WITH_INSTALLMENTS',
        'HIGHER_3M',
        'RENTAL_10_15',
        'RENTAL_15_20',
        'RENTAL_ABOVE_20'
    ];

    if (data.status && !validStatuses.includes(data.status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    if (data.price_tier && !validPriceTiers.includes(data.price_tier)) {
        throw new Error(`Invalid price_tier. Must be one of: ${validPriceTiers.join(', ')}`);
    }
    if (data.my_rating !== undefined) {
        if (!Number.isInteger(data.my_rating) || data.my_rating < 1 || data.my_rating > 5) {
            throw new Error(`Invalid my_rating. Must be an integer between 1 and 5.`);
        }
    }
}

// Helper function to validate Broker Enums
function validateBroker(data) {
    const validReliability = ['GOOD', 'AVERAGE', 'BAD'];
    if (data.reliability && !validReliability.includes(data.reliability)) {
        throw new Error(`Invalid reliability. Must be one of: ${validReliability.join(', ')}`);
    }
}

// --- Houses Endpoints ---

app.get('/api/houses', async (req, res) => {
    try {
        const command = new ScanCommand({ TableName: HOUSES_TABLE });
        const response = await docClient.send(command);
        res.json(response.Items || []);
    } catch (error) {
        console.error("Error fetching houses:", error);
        res.status(500).json({ error: "Could not fetch houses" });
    }
});

app.post('/api/houses', async (req, res) => {
    try {
        const data = req.body;
        validateHouse(data);

        const newHouse = {
            property_id: uuidv4(),
            title: data.title || '',
            link: data.link || '',
            status: data.status || 'INBOX',
            price_tier: data.price_tier || 'UNDER_2M_NO_INSTALLMENTS',
            district: data.district || '',
            broker_id: data.broker_id || null,
            pros: data.pros || [],
            cons: data.cons || [],
            notes: data.notes || '',
            my_rating: data.my_rating || 3,
        };

        const command = new PutCommand({
            TableName: HOUSES_TABLE,
            Item: newHouse
        });

        await docClient.send(command);
        res.status(201).json(newHouse);
    } catch (error) {
        console.error("Error creating house:", error);
        res.status(400).json({ error: error.message || "Could not create house" });
    }
});

app.put('/api/houses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        validateHouse(data);

        // Build UpdateExpression dynamically based on provided fields
        const updateFields = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};

        const updatableKeys = ['title', 'link', 'status', 'price_tier', 'district', 'broker_id', 'pros', 'cons', 'notes', 'my_rating'];

        updatableKeys.forEach(key => {
            if (data[key] !== undefined) {
                // #key is used to avoid reserved keyword conflicts in DynamoDB
                updateFields.push(`#${key} = :${key}`);
                expressionAttributeNames[`#${key}`] = key;
                expressionAttributeValues[`:${key}`] = data[key];
            }
        });

        if (updateFields.length === 0) {
            return res.status(400).json({ error: "No valid fields provided for update" });
        }

        const command = new UpdateCommand({
            TableName: HOUSES_TABLE,
            Key: { property_id: id },
            UpdateExpression: `SET ${updateFields.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: "ALL_NEW"
        });

        const response = await docClient.send(command);
        res.json(response.Attributes);
    } catch (error) {
        console.error("Error updating house:", error);
        res.status(400).json({ error: error.message || "Could not update house" });
    }
});

// --- Brokers Endpoints ---

app.get('/api/brokers', async (req, res) => {
    try {
        const command = new ScanCommand({ TableName: BROKERS_TABLE });
        const response = await docClient.send(command);
        res.json(response.Items || []);
    } catch (error) {
        console.error("Error fetching brokers:", error);
        res.status(500).json({ error: "Could not fetch brokers" });
    }
});

app.post('/api/brokers', async (req, res) => {
    try {
        const data = req.body;
        validateBroker(data);

        // Use provided broker_id (e.g., phone number) or generate a new UUID
        const broker_id = data.broker_id || uuidv4();

        const newBroker = {
            broker_id: broker_id,
            name: data.name || '',
            phone: data.phone || '',
            reliability: data.reliability || 'AVERAGE',
        };

        const command = new PutCommand({
            TableName: BROKERS_TABLE,
            Item: newBroker
        });

        await docClient.send(command);
        res.status(201).json(newBroker);
    } catch (error) {
        console.error("Error creating broker:", error);
        res.status(400).json({ error: error.message || "Could not create broker" });
    }
});

export const handler = process.env.AWS_LAMBDA_FUNCTION_NAME
    ? serverless(app)
    : undefined;

if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
        console.log(`DynamoDB local endpoint: http://localhost:8000`);
    });
}
