const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const fetch = require('node-fetch');

// Convert FTD format to JSON
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

            if (!object.hasOwnProperty(firstSubstring)) {
                object[firstSubstring] = {};
            }
            object[firstSubstring][secondSubstring] = parts[1];
        } else {
            console.log("No match found.");
        }
    });

    return object;
};

// Convert JSON to FTD format
const convertJsonToFtdFormat = async (jsonData) => {
    let result = '';
    for (const [key, value] of Object.entries(jsonData)) {
        for (const [innerKey, innerValue] of Object.entries(value)) {
            result += `-- string $${key}-${innerKey}: ${innerValue}\n`;
        }
    }
    return result;
};

// Fetch JSON from an API
const fetchJsonFromApi = async (apiUrl) => {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch data from API: ${response.status} ${response.statusText}`);
        }
        const jsonData = await response.json();
        return jsonData;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
};

// Read file and return default site data
const readFileAndReturnDefaultSiteData = async (filePath) => {
    const data = await fs.promises.readFile(filePath, 'utf8');
    const defaultContent = data;

    const [_, fileContents1, tail_content] = defaultContent.split(/\/\*\s*START\s*OF\s*CMS\s*DATA\s*POINTS\s*\*\/|\/\*\s*END\s*OF\s*CMS\s*DATA\s*POINTS\s*\*\//);

    const defaultSiteDataObject = await convertFtdFormatToJson(fileContents1);
    return { defaultSiteDataObject, tail_content };
};

// Update site data and write to file
const update_site = async (campaignName,templateFolder) => {
    console.log("Request to update site", campaignName);
    const responseJson = await fetchJsonFromApi(`https://campaign.admintsandbox.xyz/sitedata/${campaignName}`);
    const siteDataObject = responseJson.values[0].siteData;

    const { defaultSiteDataObject, tail_content } = await readFileAndReturnDefaultSiteData(`../${templateFolder}/default_texts.ftd`);
    const updatedSiteDataObject = defaultSiteDataObject;

    for (const parentKey in siteDataObject) {
        const childObject = siteDataObject[parentKey];

        for (const key in childObject) {
            const value = childObject[key];

            if (value !== 'undefined') {
                updatedSiteDataObject[parentKey][key] = value;
            }
        }
    }

    const fileContent = await convertJsonToFtdFormat(updatedSiteDataObject);
    const finalContent = fileContent + tail_content;

    const folderPath = `../${templateFolder}`;

    if (!fs.existsSync(folderPath)) {
        try {
            fs.mkdirSync(folderPath, { recursive: true });
            console.log(`Folder '${folderPath}' created successfully.`);
        } catch (err) {
            console.error(`Error creating folder '${folderPath}':`, err);
            process.exit(1);
        }
    } else {
        console.log(`Folder '${folderPath}' already exists.`);
    }

    const fileName = path.join(folderPath, 'texts.ftd');

    fs.writeFile(fileName, finalContent, (err) => {
        if (err) {
            console.error('An error occurred while writing the file:', err);
        } else {
            console.log(`File '${fileName}' created successfully.`);

            process.chdir(folderPath);

            const env = Object.assign({}, process.env, {
                FIFTHTRY_SITE_WRITE_TOKEN: 'ab430fa2-1935-48a4-9894-e32f8e8749b5' // Replace this with your token value
            });

            // exec('export FIFTHTRY_SITE_WRITE_TOKEN=ab430fa2-1935-48a4-9894-e32f8e8749b5 && clift upload able', { env }, (error, stdout, stderr) => {
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

// Call the update_site function to run the script
update_site("rsbb","distribution/UrlDrop/template-1"); // Replace with actual values

