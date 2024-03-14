const fs = require('fs');
const path = require('path');
const { exec } = require('child_process'); // Import exec from child_process

// Get the "Campaign id" argument from command-line arguments
const campaignId = process.argv[2]; // The first argument after the script name
const name = process.argv[3]; // The second argument after the script name
console.log(`script started to update campaign ${campaignId}`);
// Check if "Campaign id" argument is provided
if (!campaignId) {
    console.error('Campaign id is missing. Please provide the Campaign id as an argument.');
    process.exit(1); // Exit the script with a non-zero status code
}

const fileContent = `-- string $var: this is a  campaign by ${name} campaignid: ${campaignId}`;


// Define the folder path where the file will be created
const folderPath = `../FTD_CODES/sitedata/distribution/${campaignId}`; // Replace this with your desired absolute path

// Check if the folder exists
if (!fs.existsSync(folderPath)) {
    // Folder does not exist, create it
    try {
        fs.mkdirSync(folderPath, { recursive: true });
        console.log(`Folder '${folderPath}' created successfully.`);
    } catch (err) {
        console.error(`Error creating folder '${folderPath}':`, err);
        process.exit(1); // Exit the script with a non-zero status code
    }
} else {
    console.log(`Folder '${folderPath}' already exists.`);
}

// Define the file name with .ftd extension
const fileName = path.join(folderPath, 'data.ftd');

// Write the content to the file
fs.writeFile(fileName, fileContent, (err) => {
    if (err) {
        console.error('An error occurred while writing the file:', err);
    } else {
        console.log(`File '${fileName}' created successfully.`);



           // Change the current working directory
        process.chdir('../FTD_CODES'); // Replace this with your desired absolute path
        // Execute the terminal command at the end of the script
         // Define the environmental variable
         const env = Object.assign({}, process.env, {
            FIFTHTRY_SITE_WRITE_TOKEN: 'ab430fa2-1935-48a4-9894-e32f8e8749b5' // Replace this with your token value
        });
        exec('clift upload able', (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing command: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`Command stderr: ${stderr}`);
                return;
            }
            console.log(`Command stdout: ${stdout}`);
        });


    }
});

// Console log the "Campaign id"
console.log(`Campaign id: ${campaignId}`);
