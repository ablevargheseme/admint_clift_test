import express from 'express';
 import  update_site  from './services/exec_update_site.js';
const app = express();
const port = 3000; // You can choose any available port number

app.get('/', async (req, res) => {
    // Extracting query parameters from the request
    const { name} = req.query;
    const {campaign_id}=req.query;

    // Checking if both parameters exist
    if (campaign_id) {
        await  update_site(campaign_id,name)
        // Sending the parameters as a response
        res.send(`campaign site update ${campaign_id}`);
    } else {
        // Sending an error message if parameters are missing
        res.status(400).send('query parameters are required.');
    }
});
// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
