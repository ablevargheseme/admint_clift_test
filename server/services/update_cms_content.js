import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

import fetch from 'node-fetch';




const convertFtdFormatToJson = async (fileContent) => {

    const object = {};
    const lines = fileContent.trim().split('\n');

    lines.forEach(line => {
        const parts = line.split(': ');
        const regex = /\$([^-]+)-1-(.*?):/;
        const matches = regex.exec(line);

        if (matches !== null) {
            const firstSubstring = `${matches[1]}-1`;
            const secondSubstring = matches[2];

            // Ensure that object[firstSubstring] exists before accessing its properties
            if (!object.hasOwnProperty(firstSubstring)) {
                object[firstSubstring] = {}; // Create an empty object if it doesn't exist
            }
            object[firstSubstring][secondSubstring] = parts[1];

        } else {
            console.log("No match found.");
        }

    });
    

    return object;
}

const convertJsonToFtdFormat = async (jsonData) => {
    let result = '';
    for (const [key, value] of Object.entries(jsonData)) {
        for (const [innerKey, innerValue] of Object.entries(value)) {
            result += `-- string $${key}-${innerKey}: ${innerValue}\n`;
        }
    }
    return result;
}

const fetchJsonFromApi = async (apiUrl) => {
    try {
        const response = await fetch(apiUrl);
        // Check if the response is OK (status code 200)
        if (!response.ok) {
            throw new Error(`Failed to fetch data from API: ${response.status} ${response.statusText}`);
        }
        // Parse JSON response
        const jsonData = await response.json();
        return jsonData;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error; // Propagate the error
    }
}




const  readFileAndReturnDefaultSiteData= async (filePath)=> {

        const data = await fs.promises.readFile(filePath, 'utf8');
        const defaultContent = data;

        // Split the file contents into two parts
        const [_, fileContents1, tail_content] = defaultContent.split(/\/\*\s*START\s*OF\s*CMS\s*DATA\s*POINTS\s*\*\/|\/\*\s*END\s*OF\s*CMS\s*DATA\s*POINTS\s*\*\//);

        const defaultSiteDataObject = await convertFtdFormatToJson(fileContents1);
        //  console.log("defaultsiteData_object", defaultSiteDataObject);
        return {defaultSiteDataObject,tail_content};

}





// const apiUrl = 'https://campaign.admintsandbox.xyz/sitedata/jiop';







const update_site = async (campaignId, name) => {
    console.log("request to update site", campaignId);
    const responseJson = await fetchJsonFromApi(`https://campaign.admintsandbox.xyz/sitedata/${campaignId}`);
    const siteDataObject = responseJson.values[0].siteData
    // console.log("siteData", siteDataObject);
    const {defaultSiteDataObject,tail_content}= await readFileAndReturnDefaultSiteData('../TEMPLATE-1/default_texts.ftd');
    const updatedSiteDataObject=defaultSiteDataObject;
 
    for (const parentKey in siteDataObject) {
        const childObject = siteDataObject[parentKey];
        
        // Iterate over each key-value pair in the child object
        for (const key in childObject) {
          const value = childObject[key];
          
          // Check if the value is not undefined
          if (value !== 'undefined') {
            // console.log(`incomming value: ${value}`);
            // console.log("default value",defaultSiteDataObject[parentKey][key]);
            updatedSiteDataObject[parentKey][key]=value;
          }
        }
      }

    const fileContent=await convertJsonToFtdFormat(updatedSiteDataObject);
    const finalContent= fileContent+tail_content;

    // Define the folder path where the file will be created
    const folderPath = `../TEMPLATE-1`; // Replace this with your desired absolute path

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
    const fileName = path.join(folderPath, 'texts.ftd');

    // Write the content to the file
    fs.writeFile(fileName, finalContent, (err) => {
        if (err) {
            console.error('An error occurred while writing the file:', err);
        } else {
            console.log(`File '${fileName}' created successfully.`);



            // Change the current working directory
            process.chdir('../TEMPLATE-1'); // Replace this with your desired absolute path
            // Execute the terminal command at the end of the script
            // Define the environmental variable
            const env = Object.assign({}, process.env, {
                FIFTHTRY_SITE_WRITE_TOKEN: 'ab430fa2-1935-48a4-9894-e32f8e8749b5' // Replace this with your token value
            });
            // Access the value of the environmental variable directly
            //console.log(`FIFTHTRY_SITE_WRITE_TOKEN: ${env.FIFTHTRY_SITE_WRITE_TOKEN}`);
            // exec('export FIFTHTRY_SITE_WRITE_TOKEN=ab430fa2-1935-48a4-9894-e32f8e8749b5 && clift upload able', (error, stdout, stderr) => {
            //     if (error) {
            //         console.error(`Error executing command: ${error.message}`);
            //         return;
            //     }
            //     if (stderr) {
            //         console.error(`Command stderr: ${stderr}`);
            //         return;
            //     }
            //     console.log(`Command stdout: ${stdout}`);
            // });


        }
    });








};

export default update_site;
