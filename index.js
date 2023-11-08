const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app;
const verifyToken = (req, res, next) => {
  const token = req.cookies?.accessToken;
  if (!token) {
    return res.status(401).send("unauthorized access");
  }
  jwt.verify(token, process.env.ACCEESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized" });
    }
    req.user = decoded;
    next();
  });
};

app.get("/", (req, res) => {
  res.send("This is the server of Job Cracker Website");
});

const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.y6otyph.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const jobsCollection = client.db("assignment11DB").collection("jobs");
    const appliedJobsCollection = client.db("assignment11DB").collection("AppliedJobs");

    app.get("/api/v1/jobs", async (req, res) => {
      let query = {};
      if (req.query.category) {
        query = { Category: req.query.category };
      }
      const result = await jobsCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/api/v1/job/:id", async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });

    app.get('/api/v1/jobs-collection', async(req, res) => {
      let query = {};
      if (req.query.title) {
        query = { Title: {$regex: req.query.title, $options: 'i'} };
      }
      const result = await jobsCollection.find(query).toArray();
      res.send(result);
    })

    app.get('/api/v1/collection', async(req, res) => {
      let query = {};
      if (req.query.email){
        query = { PosterEmail: req.query.email };
      }
      const result = await jobsCollection.find(query).toArray();
      res.send(result);
    })

    app.get('/api/v1/application', async(req, res) => {
      const result = await appliedJobsCollection.find().toArray();
      res.send(result)
    })

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCEESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res
        .cookie('accessToken', token, {
          httpOnly: true,
          secure: false,
        })
        .send({ status: true });
    });

    app.post('/api/v1/jobs', async(req, res) => {
      const Job = req.body;
      const result = await jobsCollection.insertOne(Job);
      res.send(result)
    })

    app.post('/api/v1/application', async(req, res) => {
      const AppliedJob = req.body;
      const result = await appliedJobsCollection.insertOne(AppliedJob);
      res.send(result);
    })

    app.put('/api/v2/job', async(req, res) => {
      let query = {}
      let updatedItem = {}
      if(req.query.id){
        console.log(req.query.id);
        query = {_id: new ObjectId(req.query.id)}
        updatedItem = {$inc: {ApplicantsNumber: 1}}
      }
      const result = await jobsCollection.findOneAndUpdate(query, updatedItem )
      res.send(result)
    })

    app.put('/update/:id', async(req, res) => {
      const id = req.params.id;
      const job = req.body;
      const query = {_id: new ObjectId(id)};
      const option = {upsert: true}
      const UpdatedJob = {
        $set: {
        Company : job.company,
        companyLogo : job.companyLogo,
        PosterEmail : job.posterEmail,
        posterPhoto : job.posterPhoto,
        Title : job.title,
        UserName : job.userName,
        Category : job.category,
        salaryRange : job.salaryRange,
        Description : job.description,
        postDate : job.postDate,
        Deadline : job.deadline,
        ApplicantsNumber : job.applicantsNumber,
        Banner : job.banner
        }
      }
      const result = await jobsCollection.updateOne(query, UpdatedJob, option)
      res.send(result);
    })
    
    app.delete('/api/v1/collection/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await jobsCollection.deleteOne(query)
      res.send(result)
    })

    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`The Server Of Job Cracker Website is Running on [${port}] Port`);
});
