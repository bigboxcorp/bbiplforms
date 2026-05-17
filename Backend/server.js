import express from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const ddbClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const upload = multer({ storage: multer.memoryStorage() });

app.get('/api/forms', async (req, res) => {
  try {
    const command = new ScanCommand({
      TableName: process.env.DYNAMODB_FORMS_TABLE,
    });
    const response = await docClient.send(command);
    res.status(200).json(response.Items || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/forms', async (req, res) => {
  try {
    const formId = uuidv4();
    const { title, fields } = req.body;

    const command = new PutCommand({
      TableName: process.env.DYNAMODB_FORMS_TABLE,
      Item: {
        formId,
        title,
        fields,
      },
    });

    await docClient.send(command);
    res.status(201).json({ formId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/forms/:formId', async (req, res) => {
  try {
    const command = new GetCommand({
      TableName: process.env.DYNAMODB_FORMS_TABLE,
      Key: {
        formId: req.params.formId,
      },
    });

    const response = await docClient.send(command);
    if (!response.Item) {
      return res.status(404).json({ error: 'Form not found' });
    }
    res.status(200).json(response.Item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/forms/:formId', async (req, res) => {
  try {
    const { formId } = req.params;
    const { title, fields } = req.body;

    const command = new PutCommand({
      TableName: process.env.DYNAMODB_FORMS_TABLE,
      Item: {
        formId,
        title,
        fields,
      },
    });

    await docClient.send(command);
    res.status(200).json({ formId, message: 'Form updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/forms/:formId', async (req, res) => {
  try {
    const command = new DeleteCommand({
      TableName: process.env.DYNAMODB_FORMS_TABLE,
      Key: {
        formId: req.params.formId,
      },
    });
    await docClient.send(command);
    res.status(200).json({ message: 'Form deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/responses/:formId', upload.any(), async (req, res) => {
  try {
    const responseId = uuidv4();
    const { formId } = req.params;
    const answers = { ...req.body };
    const fileUrls = {};

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileKey = `${formId}/${responseId}/${file.originalname}`;
        const s3Command = new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: fileKey,
          Body: file.buffer,
          ContentType: file.mimetype,
        });
        await s3Client.send(s3Command);
        const url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
        
        if (!fileUrls[file.fieldname]) {
          fileUrls[file.fieldname] = [];
        }
        fileUrls[file.fieldname].push(url);
      }
    }

    const finalAnswers = { ...answers, ...fileUrls };

    const ddbCommand = new PutCommand({
      TableName: process.env.DYNAMODB_RESPONSES_TABLE,
      Item: {
        responseId,
        formId,
        answers: finalAnswers,
        submittedAt: new Date().toISOString(),
      },
    });

    await docClient.send(ddbCommand);
    res.status(201).json({ responseId, message: 'Response submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/responses/:formId', async (req, res) => {
  try {
    const command = new ScanCommand({
      TableName: process.env.DYNAMODB_RESPONSES_TABLE,
      FilterExpression: "formId = :formId",
      ExpressionAttributeValues: {
        ":formId": req.params.formId,
      },
    });

    const response = await docClient.send(command);
    const items = response.Items || [];

    for (const item of items) {
      if (item.answers) {
        for (const [key, value] of Object.entries(item.answers)) {
          if (Array.isArray(value)) {
            const signedUrls = [];
            for (const url of value) {
              if (typeof url === 'string' && url.includes('.amazonaws.com/')) {
                const fileKey = url.split('.amazonaws.com/')[1];
                const s3GetCommand = new GetObjectCommand({ Bucket: process.env.S3_BUCKET_NAME, Key: fileKey });
                const signedUrl = await getSignedUrl(s3Client, s3GetCommand, { expiresIn: 3600 });
                signedUrls.push(signedUrl);
              } else {
                signedUrls.push(url);
              }
            }
            item.answers[key] = signedUrls;
          } else if (typeof value === 'string' && value.includes('.amazonaws.com/')) {
            const fileKey = value.split('.amazonaws.com/')[1];
            const s3GetCommand = new GetObjectCommand({ Bucket: process.env.S3_BUCKET_NAME, Key: fileKey });
            const signedUrl = await getSignedUrl(s3Client, s3GetCommand, { expiresIn: 3600 });
            item.answers[key] = signedUrl;
          }
        }
      }
    }

    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});