const express = require('express');
const app = express();
const port = 3000; // You can choose any available port number

app.get('/', (req, res) => {
    // Extracting query parameters from the request
    const { name} = req.query;

    // Checking if both parameters exist
    if (name) {
        // Sending the parameters as a response
        res.send(`name ${name}`);
    } else {
        // Sending an error message if parameters are missing
        res.status(400).send('query parameters are required.');
    }
});
// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
