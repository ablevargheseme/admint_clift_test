import "https://cdnjs.cloudflare.com/ajax/libs/axios/1.3.4/axios.min.js";
import * as config from "./config.js";
import "https://www.googletagmanager.com/gtag/js";
import "https://cdn.jsdelivr.net/npm/@toruslabs/torus-embed@4.0.7/dist/torus.umd.min.js";
import "https://cdn.jsdelivr.net/npm/web3@1.7.3/dist/web3.min.js";
import { WalletPopup } from "./walletPopup.js";
import './app-state.js';

const torus = new Torus.default();

/* console.log("entering index page!"); */

export var campaignId = "undefined";
export var inviteCode = "undefined";
var connectedWalletAddress = "undefined";
var walletConnectionStatus = false;
var userNftContractAddress = "undefined";
var userNftTokenId = "undefined";

function convertToColorBlocks(text) {
  const lines = text.trim().split("\n");
  const colorBlocks = [];
  let currentBlock = [];
  for (const line of lines) {
    if (line.trim().startsWith("-- ftd.color")) {
      if (currentBlock.length === 3) {
        colorBlocks.push(currentBlock.join("\n"));
      }
      currentBlock = [line.trim()];
    } else if (currentBlock.length > 0 && currentBlock.length < 3) {
      currentBlock.push(line.trim());
    }
  }
  if (currentBlock.length === 3) {
    colorBlocks.push(currentBlock.join("\n"));
  }
  return colorBlocks.join("\n\n");
}

window.color_scheme_to_ftd = async function color_scheme_to_ftd(
  colorSchemeData
) {
  return new Promise(async (resolve, reject) => {
    try {
      const filteredText = convertToColorBlocks(colorSchemeData);
      const blocks = filteredText.split("-- ftd.color");
      const trimmedBlocks = blocks.map((block) => block.trim());
      const nonEmptyBlocks = trimmedBlocks.filter((block) => block.length > 0);
      const result = nonEmptyBlocks.map((block) => {
        const lines = block.split("\n");
        const obj = { colors: lines[0].trim().replace(/:/g, "") };
        lines.slice(1).forEach((line) => {
          const [key, value] = line.split(":");
          obj[key.trim().replaceAll('-', '_')] = value.trim();
        });
        return obj;
      });
      resolve(result);
    } catch (e) {
      reject(e);
    }
  });
};

const fonts_to_load = new Set();

const GOOGLE_FONT_NAMES = {
  "opensans": "Open Sans",
  "narrow": "Pragati Narrow",
  "mono": "Roboto Mono",
  "tiro": "Tiro Devanagari Marathi",
};

const getGoogleFontName = name => GOOGLE_FONT_NAMES[name.toLowerCase()] ?? name;

window.convertJSONFormat = async function convertJSONFormat(inputData) {

  /* console.log("input data is ",inputData); */
  const convertedOutput=[];
  inputData.forEach((obj)=>{
    var parentObjType=obj.type.replace(/-(mobile|desktop)$/, '');
    var parentObj= {};
    var mobileVal={};
    var desktopVal={};
    // console.log("parentObjs are ",parentObj)  
    const fontFamily = getGoogleFontName(obj["font-family"].split('-').pop());
    fonts_to_load.add(fontFamily);
    if(obj.type.includes("mobile")){
       /* console.log("mobile objects are ",parentObjType); */
       mobileVal={
        "font_family": fontFamily,
        "line_height": obj["line-height"],
        "size": obj["size"],
        "letter_spacing": obj["letter-spacing"],
        "weight": obj["weight"],
      };
      // console.log("parent objects are : ",parentObj)
    }
    else if(obj.type.includes("desktop")){
      // console.log("desktop objects are ",obj)
      desktopVal={
        "font_family": fontFamily,
        "line_height": obj["line-height"],
        "size": obj["size"],
        "letter_spacing": obj["letter-spacing"],
        "weight": obj["weight"]
      };
    }
    parentObj[`${parentObjType}`]={
      "mobile": mobileVal,
      "desktop": desktopVal
  }
    convertedOutput.push(parentObj);
  })

  const mergedResult = {};

  for (const obj of convertedOutput) {
      const key = Object.keys(obj)[0];
      const subObject = obj[key];
  
      if (!mergedResult[key]) {
          mergedResult[key] = subObject;
      } else {
          mergedResult[key] = {
              mobile: fastn.recordInstance({
                  ...mergedResult[key].mobile,
                  ...subObject.mobile
              }),
              desktop: fastn.recordInstance({
                  ...mergedResult[key].desktop,
                  ...subObject.desktop
              })
          };
      }
  }
  
  const outputArray = Object.keys(mergedResult).map(key => ({
      [key]: mergedResult[key]
  }));
  
  /* console.log("sdfsdf",outputArray); */
  return outputArray;
}

window.font_scheme_to_ftd = async function font_scheme_to_ftd(
  fontSchemeData, fontFamily
) {
  const fontOutput=await convertDataFormat(fontSchemeData,fontFamily);
  /* console.log("converted font output is ",fontOutput); */
  const convertedOutput=await convertJSONFormat(fontOutput);
  // console.log("next level output is ",convertedOutput)
  return convertedOutput;
};

ftd.on_load(async function () {
  const state = document.querySelector("app-state")?.state;

  readUrlParams(state)
    .then(() => {
      /* console.log("readUrlParams() promise resolved"); */
    })
    .catch((error) => {
      /* console.log("readUrlParams() promise rejected"); */
      console.error("Promise rejected : readUrlParams(), Reason : ", error);
      // window.ftd.set_value(
      //   `${config.FTD_TEMPLATE_BASE_URL}/#loadedState`,
      //   "loaded"
      // );
    });
  init();
});

// function getUrlParameters() {
//   const url = window.location.href;
//   const [baseUrl, fragment] = url.split("#");
//   if (fragment) {
//     const [fragmentPart, queryString] = fragment.split("?");
//     const fragmentParams = new URLSearchParams(queryString);
//     const decodedParams = {};
//     for (const [key, value] of fragmentParams.entries()) {
//       decodedParams[key] = decodeURIComponent(value);
//     }

//     return {
//       baseUrl: baseUrl,
//       fragmentParams: decodedParams,
//     };
//   }

//   return {
//     baseUrl: baseUrl,
//   };
// }

window.mergeObjectsWithDefaults = function mergeObjectsWithDefaults(obj1, obj2)  {
  const merged = {};
  for (let key in obj2) {
    const val1 = obj1[key.replaceAll('_', '-')];
    key = key.replaceAll('-', '_');
    const val2 = obj2[key];
    if (obj2.hasOwnProperty(key)) {
      if (typeof val2 === 'object' && val2 !== null) {
        // Recursively merge nested objects
        merged[key] = mergeObjectsWithDefaults(val1 || {}, val2);
      } else {
        // Use the value from obj1 if it's not "undefined", otherwise use obj2's value
        merged[key] = val1 !== "undefined" ? val1 : val2;
      }
    }
  }

  return merged;
}

async function loadGoogleFont(fontName) {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css?family=${fontName.replace(' ', '+')}`;
    
    document.head.appendChild(link);
    
    link.onload = () => {
      console.log(`Font '${fontName}' has been loaded.`);
      resolve();
    };

    link.onerror = () => {
      console.error(`Error loading font '${fontName}'.`);
      reject(`Error loading font '${fontName}'.`);
    };
  });
}

const ftdToJs = value => {
  if(!value) {
    return null;
  }

  if(value instanceof fastn.mutableClass) {
    return ftdToJs(value.get());
  } else if(value instanceof fastn.mutableListClass) {
    return ftdToJs(value.getList());
  } else if(value instanceof fastn.recordInstanceClass) {
    return ftdToJs(value.getAllFields());
  } else if(Array.isArray(value)) {
    const arr = [];
    for(const { item } in value) {
      arr.push(ftdToJs(item));
    }
    return arr;
  } else if(typeof value === 'object') {
    const obj = {};
    for(const [prop, val] of Object.entries(value)) {
      obj[prop.replaceAll('-', '_')] = ftdToJs(val);
    }

    return obj;
  }

  return value;
};

const mapToFtd = (value, jsValue) => {
  if(!jsValue) {
    return;
  }
  
  if(typeof jsValue === 'object') {
    (Array.isArray(jsValue) ? jsValue : Object.entries(jsValue))
      .forEach(([key, val]) => mapToFtd(value.get(key), val));

    return value;
  }

  value.set(jsValue);

  return value;
};

window.readUrlParams = async function readUrlParams(state) {
  return new Promise(function (resolve, reject) {
    var inviteId;
    var domainName;
    var nftType;
    const url = window.location.href;

    /* console.log("url from broswer is ", url); */
    /* console.log("no fragment detected"); */
    var urlParams = new URLSearchParams(window.location.search);
    inviteId = urlParams.get("invite_id");
    domainName = urlParams.get("cname");
    nftType = urlParams.get("type");
    var nftTypeDisp;

    if(nftType){
      nftTypeDisp=nftType.charAt(0).toUpperCase() + nftType.slice(1);     
    }
    else{
      nftTypeDisp=" "
    }   
    state.texts.get("nft_type").set(nftTypeDisp);
    // window.ftd.set_value(
    //   `${config.FTD_TEMPLATE_BASE_URL}/texts#nft-type`,
    //   nftTypeDisp
    // );

    /* console.log("invite id is ", inviteId); */
    /* console.log("cname is ", domainName); */
    /* console.log("nft type is ", nftType); */

    //domainName = cName;
    inviteCode = inviteId;    

    fetchUiComponents(state, domainName, nftType)
      .then(async(result) =>  {
        /* console.log("fetchUiComponents() promise resolved"); */
        
        // if (!result.values[0].siteData.hasOwnProperty("colorScheme")) {
        //   reject("color scheme url key not included");
        //   return;
        // }
        /* console.log("result from server is ",result.values[0]); */
        if(result.values[0].siteData){
          try{
            const siteData=result.values[0].siteData;      
            const templateEditorRecordObj = state.texts.get("templateEditorRecordObj");
            var defaultSiteDataObj = ftdToJs(templateEditorRecordObj); 
            // var  defaultSiteDataObj=await window.ftd.get_value(
            //   "main",
            //   `${config.FTD_TEMPLATE_BASE_URL}/texts#templateEditorRecordObj`
            // );          
            console.log("default site data is ",defaultSiteDataObj)
            const mergedObject =  mergeObjectsWithDefaults(siteData, defaultSiteDataObj);
            /* console.log("site data filtered is ",mergedObject); */           
            // defaultSiteDataObj.set(mergedObject); // CIO
            mapToFtd(templateEditorRecordObj, mergedObject)
            // window.ftd.set_value(
            //   `${config.FTD_TEMPLATE_BASE_URL}/texts#templateEditorRecordObj`,
            //   mergedObject
            // );
          }
          catch(e){
              console.log("error : ",e);
          }          
        }
        
       
        var fontFamily=result.values[0].fontScheme.schemeFamily;
        var fontUrl=result.values[0].fontScheme.schemeUrl;
        fetchFontScheme(fontUrl).then((fontSchemeData)=>{
          /* console.log("font scheme recieved is ",fontSchemeData); */
          font_scheme_to_ftd(fontSchemeData,fontFamily).then((output)=>{
              console.log("FONTS TO LOAD", fonts_to_load);
              Promise.all([...fonts_to_load].map(loadGoogleFont)).then(() => {
                output.forEach((font_types)=>{
                  /* console.log("font_types are ",font_types); */
                  const keyName = Object.keys(font_types)[0];
                  console.log('font to update is ',font_types[keyName], fastn.recordInstance(font_types[keyName]));
                  window.ftd.set_value(
                    `${config.FTD_TEMPLATE_BASE_URL}/fonts#${keyName}`,
                    fastn.recordInstance(font_types[keyName]),
                  );
                })
              });
          });
        });

        fetchColorScheme(result.values[0].colorSchemeUrl)
          .then((colorSchemeData) => {
            /* console.log("fetchColorScheme() promise resolved"); */
            color_scheme_to_ftd(colorSchemeData)
              .then((resultColorsObj) => {
                resultColorsObj.forEach((obj) => {
                  try {
                    var colors = obj.colors.replaceAll('-', '_');
                    if (obj.hasOwnProperty("colors")) {
                      delete obj["colors"];
                    }
                    if (obj.light != undefined && obj.light != "undefined") {
                      window.ftd.set_value(
                        `${config.FTD_TEMPLATE_BASE_URL}/colors#${colors}.light`,
                        obj.light
                      );
                    }
                    if (obj.dark != undefined && obj.dark != "undefined") {
                      window.ftd.set_value(
                        `${config.FTD_TEMPLATE_BASE_URL}/colors#${colors}.dark`,
                        obj.dark
                      );
                    }
                  } catch (e) {
                    console.error(e);
                  }
                });
                /* console.log("ftd colors updated"); */
              })
              .catch((error) => {
                console.error(
                  "Promise rejected : color_scheme_to_ftd(), Reason : ",
                  error
                );
              });
          })
          .catch((error) => {
            console.error(
              "Promise rejected : fetchColorScheme(), Reason : ",
              error
            );
          });
        resolve(result);
      })
      .catch((error) => {
        console.error(
          "Promise rejected : fetchUiComponents(), Reason : ",
          error
        );
        reject(error);
      });
  }).then(() => {
    state.loadedState.set("loaded");
  }).catch((error) => {
    state.loadedState.set("loaded");
  });
};

window.fetchUiComponents = async function fetchUiComponents(
  state,
  domainName,
  nftType
) {
  return new Promise(function (resolve, reject) {
    if (domainName == undefined) {
      reject("domain name is undefined");
      return;
    }

    const url = `${config.DISTRIBUTION_BASE_BACKEND_URL}/sitedata/${domainName}`;
    const apiConfig = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    axios
      .get(url, apiConfig)
      .then((response) => {
        const respData = response.data;

        if (!respData.hasOwnProperty("values")) {
          reject("values key not included in response from server");
          return;
        }
        if (respData.values.length <= 0) {
          reject("values is an empty array");
          return;
        }

        /* console.log("checks passed"); */
        if (respData.values[0].hasOwnProperty("campaignId")) {
          campaignId = respData.values[0].campaignId;
          gtag("event", "campaignId fetched", {
            event_category: "Page init",
            event_label: domainName,
            campaign_id: `${campaignId}`,
          });
        }
        if (respData.values[0].hasOwnProperty("bannerImageUrl")) {
          checkImageURL(respData.values[0].bannerImageUrl)
            .then((validImageUrl) => {
              /* console.log("this is a valid image url", validImageUrl); */
              state.images.get("hero_image_url", validImageUrl);
              // window.ftd.set_value(
              //   `${config.FTD_TEMPLATE_BASE_URL}/images#hero-image-url`,
              //   validImageUrl
              // );
            })
            .catch((error) => {
              console.error(error);
            });
        }
        if (respData.values[0].hasOwnProperty("creativeDatas")) {
          updateCreativeDataUi(state, respData.values[0].creativeDatas, nftType)
            .then(() => {
              /* console.log("creative data updated"); */
              // window.ftd.set_value(
              //   `${config.FTD_TEMPLATE_BASE_URL}/#loadedState`,
              //   "loaded"
              // );
            })
            .catch((error) => {
              console.error(error);
            });
        }
        resolve(respData);
      })
      .catch((error) => {
        console.error(error);
        reject(error);
      });
  });
};

window.fetchColorScheme = async function fetchColorScheme(colorSchemeUrl) {
  return new Promise(async (resolve, reject) => {
    const url = `${config.COLOR_SCHEME_BASE_URL}/${colorSchemeUrl}`;
    const apiConfig = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    axios
      .get(url, apiConfig)
      .then((response) => {
        const respData = response.data;
        // console.log("color scheme data recevied is ",respData)
        resolve(respData);
      })
      .catch((error) => {
        console.error(error);
        reject(error);
      });
  });
};

window.fetchFontScheme = async function fetchFontScheme(fontSchemeUrl) {
  return new Promise(async (resolve, reject) => {
    const url = `${config.FONT_SCHEME_BASE_URL}/${fontSchemeUrl}`;
    const apiConfig = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    axios
      .get(url, apiConfig)
      .then((response) => {
        const respData = response.data;
        // console.log("font scheme data recevied is ",respData)
        resolve(respData);
      })
      .catch((error) => {
        console.error(error);
        reject(error);
      });
  });
};

window.updateCreativeDataUi = async function updateCreativeDataUi(
  state,
  creativeDatasArray,
  nftType
) {
  return new Promise(async (resolve, reject) => {
    // console.log(
    //   "creative datas array is ",
    //   creativeDatasArray,
    //   "type for updation is ",
    //   nftType
    // );
    try {
      if(!nftType && Array.isArray(creativeDatasArray) && creativeDatasArray.length>0){
        state.images.set("nft_image_url", creativeDatasArray[0].imageUrl);
        // window.ftd.set_value(
        //   `${config.FTD_TEMPLATE_BASE_URL}/images#nft-image-url`,
        //   creativeDatasArray[0].imageUrl
        // );
        state.texts.set("nft_type", creativeDatasArray[0].rarity?.get());
        // window.ftd.set_value(
        //   `${config.FTD_TEMPLATE_BASE_URL}/texts#nft-type`,
        //   creativeDatasArray[0].rarity
        // );
        resolve("nft image updation success");
        return;
      }
      creativeDatasArray.forEach((obj) => {
        if (obj.rarity == nftType) {
          /* console.log("creatives match found "); */
          if (obj.hasOwnProperty("creativeContractAddress")) {
            userNftContractAddress = obj.creativeContractAddress;
          }
          if (obj.hasOwnProperty("imageUrl")) {
            /* console.log("checking nft image"); */
            state.images.get("nft_image_url").set(obj.imageUrl);
            // window.ftd.set_value(
            //   `${config.FTD_TEMPLATE_BASE_URL}/images#nft-image-url`,
            //   obj.imageUrl
            // );
          }
        }
      });
      resolve("nft image updation success");
    } catch (e) {
      reject(e);
    }
  });
};

window.isValidJSON = async function isValidJSON(response) {
  try {
    JSON.parse(response);
    return true;
  } catch (error) {
    return false;
  }
};

window.showSuccessPopup = async function showSuccessPopup(state, inputData, title) {
  /* console.log("input data is ", inputData); */

  state.texts.get("popup_title").set(title);
  // window.ftd.set_value(
  //   `${config.FTD_TEMPLATE_BASE_URL}/texts#popup-title`,
  //   title
  // );
  state.texts.get("popup_body").set(inputData);
  // window.ftd.set_value(
  //   `${config.FTD_TEMPLATE_BASE_URL}/texts#popup-body`,
  //   inputData
  // );
  state.images.get("popup_image").set("images/success.png");
  // window.ftd.set_value(
  //   `${config.FTD_TEMPLATE_BASE_URL}/images#popup-image`,
  //   "images/success.png"
  // );
  // state.lib.get("pop_up_status").set(true);
  window.ftd.set_value(
    `${config.FTD_TEMPLATE_BASE_URL}/lib#pop-up-status`,
    true
  );
};

window.showFailurePopup = async function showFailurePopup(state, inputData, title) {
  /* console.log("input data is ", inputData); */

 // state.texts.get("popup_title", title);
  window.ftd.set_value(
    `${config.FTD_TEMPLATE_BASE_URL}/texts#popup-title`,
    title
  );
  //state.texts.get("popup_body").set(inputData);
  window.ftd.set_value(
    `${config.FTD_TEMPLATE_BASE_URL}/texts#popup-body`,
    inputData
  );
  //state.images.get("popup_image").set("images/error.svg");
  window.ftd.set_value(
    `${config.FTD_TEMPLATE_BASE_URL}/images#popup-image`,
    "images/error.svg"
  );
  // state.lib.get("pop_up_status").set(true);
  window.ftd.set_value(
    `${config.FTD_TEMPLATE_BASE_URL}/lib#pop-up-status`,
    true
  );
};

window.showWarningPopup = async function showWarningPopup(state, inputData, title) {
  /* console.log("input data is ", inputData); */
  state.texts.get("popup_title").set(title);
  // window.ftd.set_value(
  //   `${config.FTD_TEMPLATE_BASE_URL}/texts#popup-title`,
  //   title
  // );
  state.texts.get("popup_body").set(inputData);
  // window.ftd.set_value(
  //   `${config.FTD_TEMPLATE_BASE_URL}/texts#popup-body`,
  //   inputData
  // );
  state.images.get("popup_image").set("images/error.svg");
  // window.ftd.set_value(
  //   `${config.FTD_TEMPLATE_BASE_URL}/images#popup-image`,
  //   "images/error.svg"
  // );
  // console.log(state.lib)
  // state.lib.get("pop_up_status").set(true);
  window.ftd.set_value(
    `${config.FTD_TEMPLATE_BASE_URL}/lib#pop-up-status`,
    true
  );
};

window.checkImageURL = async function checkImageURL(url) {
  /* console.log("input url is ", url); */
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error("Invalid image URL"));
    img.src = url;
    connectWallet;
  });
};

window.connectWallet = async function connectWallet() {
  /* console.log("entering connect wallet function"); */
  if (walletConnectionStatus) {
    /* console.log("wallet already connected"); */
    return;
  }
  connectWalletClickEvent();
  const walletPopup = new WalletPopup();
  document.body.appendChild(walletPopup);
};

window.connectWalletProvider = async function connectWalletProvider(
  selectedProvider
) {
  const state = document.querySelector("app-state")?.state;
  /* console.log("entering connectWalletProvider function", selectedProvider); */
  if (selectedProvider == "metamask") {
    onConnect();
    metamaskConnectionTriggerEvent();
  } else if (selectedProvider == "torus (sign in with google)") {
    torusConnectionTriggerEvent();
    torusInit()
      .then(async () => {
        await torus.login();
        const provider = torus.provider;
        const web3 = new Web3(provider);
        const accounts = await web3.eth.getAccounts();
        connectedWalletAddress = accounts[0];
        /* console.log("Connected with address:", connectedWalletAddress); */
        walletConnectionStatus = true;
        const buttonDisplayStringStart = `${connectedWalletAddress[0]}${connectedWalletAddress[1]}${connectedWalletAddress[2]}${connectedWalletAddress[3]}${connectedWalletAddress[4]}${connectedWalletAddress[5]}`;
        const buttonDisplayStringEnd = `${
          connectedWalletAddress[connectedWalletAddress.length - 4]
        }${connectedWalletAddress[connectedWalletAddress.length - 3]}${
          connectedWalletAddress[connectedWalletAddress.length - 2]
        }${connectedWalletAddress[connectedWalletAddress.length - 1]}`;
        console.log("torus wallet connected part")
        state.texts.get("templateEditorRecordObj").get("cmsNavigationBar_1").get("button_text").set(`Connected  (${buttonDisplayStringStart}...${buttonDisplayStringEnd})`);
        // window.ftd.set_value(
        //   `${config.FTD_TEMPLATE_BASE_URL}/texts#templateEditorRecordObj.cmsNavigationBar-1.button-text`,   
        //   `Connected  (${buttonDisplayStringStart}...${buttonDisplayStringEnd})`
        // );
        if (torus.isLoggedIn) {
          torus.torusWidgetVisibility = true;
        }
        torusConnectionSuccessEvent();
        checkForNftOwnership();
      })
      .catch((error) => {
        console.error("Failed to open torus:", error);
      });
  }
};

window.torusInit = async function torusInit() {
  return new Promise(async (resolve, reject) => {
    /* console.log("Initialising torus"); */
    try {
      if (torus.isInitialized) {
        /* console.log("torus is already initialised as :  ", torus); */
        resolve("done");
        return;
      }
      await torus.init({
        network: {
          host: "matic",
        },
      });
      /* console.log("torus initialised as :  ", torus); */
      resolve("done");
    } catch (e) {
      reject(e);
    }
  });
};

window.sendWallet = async function sendWallet() {
  claimEvent();

  const state = document.querySelector("app-state")?.state;

  if (!walletConnectionStatus) {
    showWarningPopup(
      state,
      "If you don't have an existing wallet, use Torus to sign up.",
      "Connect wallet to claim."
    );
    return;
  }
  try {
    /* console.log("account to send is ", connectedWalletAddress); */
    if (campaignId != "undefined" && inviteCode != "undefined") {
      fetch(`${config.DISTRIBUTION_BASE_BACKEND_URL}/open/dropWallet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: `${connectedWalletAddress}`,
          campaignId: `${campaignId}`,
          inviteCode: `${inviteCode}`,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          /* console.log(data); */
          if (
            data.hasOwnProperty("success") &&
            data.hasOwnProperty("message")
          ) {
            if (data.success) {
              showSuccessPopup(state, data.message, "Claim successful.");
              claimSuccessEvent();
            } else {
              showFailurePopup(state, data.message, "Claim unsuccessful.");
              if (data.message == "Not a valid ethereum wallet address.") {
                addWalletFailEvent();
              }
              if (data.message == "This token has already been claimed.") {
                alreadyClaimedEvent();
              }
            }
          }
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      invalidLinkEvent();
      showWarningPopup(
        state,
        "You are using an incorrect invite URL.",
        "Claim unsuccessful."
      );
    }
  } catch (error) {
    console.error(error.message);
  }
};

window.dataLayer = window.dataLayer || [];

window.gtag = function gtag() {
  dataLayer.push(arguments);
};
gtag("js", new Date());
gtag("config", config.G_TAG_ID);

window.claimEvent = async function claimEvent() {
  // Claim button click
  gtag("event", "click", {
    event_category: "Button Click",
    event_label: "Claim Button",
    campaign_id: `${campaignId}`,
  });
};

window.connectWalletClickEvent = async function connectWalletClickEvent() {
  // Connect wallet click
  gtag("event", "click", {
    event_category: "Button Click",
    event_label: "Connect Wallet Button",
    campaign_id: `${campaignId}`,
  });
};

window.invalidLinkEvent = async function invalidLinkEvent() {
  // Invalid link event
  gtag("event", "click", {
    event_category: "popup",
    event_label: "Invalid Link",
    campaign_id: `${campaignId}`,
  });
};

window.connectWalletSkipEvent = async function connectWalletSkipEvent() {
  // Connect wallet skip event
  gtag("event", "click", {
    event_category: "skip",
    event_label: "Skip Wallet Connect",
    campaign_id: `${campaignId}`,
  });
};

window.addWalletFailEvent = async function addWalletFailEvent() {
  // Not a valid address event
  gtag("event", "response", {
    event_category: "api response",
    event_label: "Address Add Failed",
    campaign_id: `${campaignId}`,
  });
};

window.claimSuccessEvent = async function claimSuccessEvent() {
  // Claim successful event
  gtag("event", "response", {
    event_category: "api response",
    event_label: "Address Add Succesful",
    campaign_id: `${campaignId}`,
  });
};

window.alreadyClaimedEvent = async function alreadyClaimedEvent() {
  // Already claimed event
  gtag("event", "response", {
    event_category: "api response",
    event_label: "Address Already Added",
    campaign_id: `${campaignId}`,
  });
};

window.walletDisconnectEvent = async function walletDisconnectEvent() {
  // Wallet disconnect from metamask event
  gtag("event", "process", {
    event_category: "process result",
    event_label: "Wallet Disconnected",
    campaign_id: `${campaignId}`,
  });
};

window.metamaskConnectionTriggerEvent =
  async function metamaskConnectionTriggerEvent() {
    // Metamask triggered event
    gtag("event", "click", {
      event_category: "button click",
      event_label: "Metamask Option Selected",
      campaign_id: `${campaignId}`,
    });
  };

window.metamaskConnectionSuccessEvent =
  async function metamaskConnectionSuccessEvent() {
    // Metamask connection success event
    gtag("event", "process", {
      event_category: "success",
      event_label: "Metamask Connection Successful",
      campaign_id: `${campaignId}`,
    });
  };

window.torusConnectionTriggerEvent =
  async function torusConnectionTriggerEvent() {
    // Torus triggered event
    gtag("event", "click", {
      event_category: "button click",
      event_label: "Torus Option Selected",
      campaign_id: `${campaignId}`,
    });
  };

window.torusConnectionSuccessEvent =
  async function torusConnectionSuccessEvent() {
    // Torus connection success event
    gtag("event", "process", {
      event_category: "success",
      event_label: "Torus Connection Successful",
      campaign_id: `${campaignId}`,
    });
  };

window.viewInOpenseaEvent = async function viewInOpenseaEvent() {
  // View in opensea event
  gtag("event", "click", {
    event_category: "button click",
    event_label: "View NFT Button",
    campaign_id: `${campaignId}`,
  });
};

window.navigateToComponent = async function navigateToComponent(elementId) {
  /* console.log("entering navigateToComponent function with id ", elementId); */
  const element = document.getElementById(`${elementId}${config.FTD_ID_APPEND_STRING}`);
  element.scrollIntoView({
    behavior: "smooth",
    block: "start",
    inline: "nearest",
  });
};

window.checkForNftOwnership = async function checkForNftOwnership() {
  console.log(
    "entering checkForNftOwnership function with wallet id ",
    connectedWalletAddress
  );
  /* console.log("nft contract address to verify is : ", userNftContractAddress); */
  const state = document.querySelector("app-state")?.state;
  const url = `${config.DISTRIBUTION_BASE_BACKEND_URL}/open/nft`;
  try {
    const params = {
      wallet_address: `${connectedWalletAddress}`,
      campaign_id: `${campaignId}`,
    };
    const apiConfig = {
      headers: {
        "Content-Type": "application/json",
      },
    };
    await axios
      .get(url, { params, apiConfig })
      .then((response) => {
        const respData = response.data;

        if (!respData.hasOwnProperty("success")) {
          /* console.log("success not in response"); */
          return;
        }
        if (!respData.hasOwnProperty("values")) {
          /* console.log("values not in response"); */
          return;
        }
        if (respData.success) {
          if (respData.values.length <= 0) {
            /* console.log("assets are null"); */
           // state.lib.get().set("viewNftButtonStatus",false);
            window.ftd.set_value(
              `${config.FTD_TEMPLATE_BASE_URL}/lib#viewNftButtonStatus`,
              false
            );
            return;
          }
         // state.lib.get("viewNftButtonStatus").set(true);
          window.ftd.set_value(
            `${config.FTD_TEMPLATE_BASE_URL}/lib#viewNftButtonStatus`,
            true
          );
          userNftContractAddress = respData.values[0].tokenAddress;
          userNftTokenId = respData.values[0].tokenId;
        }
      })
      .catch((error) => {
        console.error(error);
      });
  } catch (error) {
    console.error("An error occurred:", error.message);
  }
};

window.viewNftInOpensea = async function viewNftInOpensea() {
  /* console.log("entering viewNftInOpensea function "); */
  const state = document.querySelector("app-state")?.state;
  if (userNftContractAddress != "undefined" && userNftTokenId != "undefined") {
    const openseaUrl = `${config.OPENSEA_VIEW_NFT_BASE_URL}/${userNftContractAddress}/${userNftTokenId}`;
    const newTab = window.open(openseaUrl, "_blank");
    newTab.focus();
  } else {
   // state.lib.get("viewNftButtonStatus").set(false);
    window.ftd.set_value(
      `${config.FTD_TEMPLATE_BASE_URL}/lib#viewNftButtonStatus`,
      false
    );
  }
  viewInOpenseaEvent();
};

//////////////////////// Wallet connect code below ////////////////////////////////////////////////////////
/* console.log(window.Web3Modal); */
const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
const Fortmatic = window.Fortmatic;
const evmChains = window.evmChains;
let web3Modal;
let provider;

async function init() {
  /* console.log("Initializing example"); */
  /* console.log("WalletConnectProvider is", WalletConnectProvider); */
  /* console.log("Fortmatic is", Fortmatic); */
  // console.log(
  //   "window.web3 is",
  //   window.web3,
  //   "window.ethereum is",
  //   window.ethereum
  // );

  const deviceType = await window.ftd.get_value("main", "ftd#device");
  /* console.log("device type from ftd is ", deviceType); */
  /* console.log("infura id is ", config.WALLET_CONNECT_INFURA_ID); */

  let providerOptions =
    deviceType == "desktop"
      ? {}
      : {
          walletconnect: {
            package: WalletConnectProvider,
            options: {
              // Mikko's test key - don't copy as your mileage may vary
              infuraId: config.WALLET_CONNECT_INFURA_ID,
              qrcode: true,
              qrcodeModalOptions: {
                desktopLinks: [],
                mobileLinks: ["metamask"],
              },
            },
          },
        };

  /* console.log("selected provider option is : ", providerOptions); */

  web3Modal = new Web3Modal({
    cacheProvider: false, // optional
    providerOptions, // required
    disableInjectedProvider: false, // optional. For MetaMask / Brave / Opera.
  });
  /* console.log("Web3Modal instance is", web3Modal); */
}

async function fetchAccountData() {
  const web3 = new Web3(provider);
  const state = document.querySelector("app-state")?.state;
  /* console.log("Web3 instance is", web3); */
  const chainId = await web3.eth.getChainId();
  const accounts = await web3.eth.getAccounts();

  if (accounts.length != 0) {
    /* console.log("Got accounts", accounts); */
    connectedWalletAddress = accounts[0];
    /* console.log("selected wall accnt is ", connectedWalletAddress); */
    walletConnectionStatus = true;
    const buttonDisplayStringStart = `${connectedWalletAddress[0]}${connectedWalletAddress[1]}${connectedWalletAddress[2]}${connectedWalletAddress[3]}${connectedWalletAddress[4]}${connectedWalletAddress[5]}`;
    const buttonDisplayStringEnd = `${
      connectedWalletAddress[connectedWalletAddress.length - 4]
    }${connectedWalletAddress[connectedWalletAddress.length - 3]}${
      connectedWalletAddress[connectedWalletAddress.length - 2]
    }${connectedWalletAddress[connectedWalletAddress.length - 1]}`;
    console.log("ready to change button text")
    state.texts.get("templateEditorRecordObj").get("cmsNavigationBar_1").get("button_text").set(`Connected  (${buttonDisplayStringStart}...${buttonDisplayStringEnd})`);
    // window.ftd.set_value(
    //   `${config.FTD_TEMPLATE_BASE_URL}/texts#templateEditorRecordObj.cmsNavigationBar-1.button-text`,   
    //   `Connected  (${buttonDisplayStringStart}...${buttonDisplayStringEnd})`
    // );
    metamaskConnectionSuccessEvent();
    checkForNftOwnership();
    return;
  }
  state.texts.get("templateEditorRecordObj").get("cmsNavigationBar_1").get("button_text").set(`Connect Wallet`);
  // window.ftd.set_value(
  //   `${config.FTD_TEMPLATE_BASE_URL}/texts#templateEditorRecordObj.cmsNavigationBar-1.button-text`,   
  //   `Connect Wallet`
  // );
  //state.lib.get("viewNftButtonStatus").set(false);
  window.ftd.set_value(
    `${config.FTD_TEMPLATE_BASE_URL}/lib#viewNftButtonStatus`,
    false
  );
  walletDisconnectEvent();
  walletConnectionStatus = false;
}

async function refreshAccountData() {
  await fetchAccountData(provider);
}
window.onConnect = async function onConnect() {
  /* console.log("Entering onConnect function"); */
  const deviceType = await window.ftd.get_value("main", "ftd#device");
  /* console.log("device type from ftd is ", deviceType); */
  /* console.log("window etheruem is  ", window.ethereum); */
  if (deviceType == "desktop" && window.ethereum == undefined) {
    showFailurePopup(
      "Metamask is not installed in the browser. Use Torus to sign up.",
      "Connect wallet unsuccessful."
    );
    return;
  }
  try {
    provider = await web3Modal.connect();
  } catch (e) {
    /* console.log("Could not get a wallet connection", e); */
    return;
  }
  /* console.log("connection to metamask complete"); */

  provider.on("accountsChanged", (accounts) => {
    /* console.log("account change detected", accounts); */
    fetchAccountData();
  });

  provider.on("chainChanged", (chainId) => {
    /* console.log("account change detected", chainId); */
    fetchAccountData();
  });

  provider.on("networkChanged", (networkId) => {
    /* console.log("network change detected", networkId); */
    fetchAccountData();
  });

  await refreshAccountData();
};

//  async function onDisconnect() {

//    /* console.log("Killing the wallet connection", provider); */
//    if(provider.close) {
//      await provider.close();
//      await web3Modal.clearCachedProvider();
//      provider = null;
//    }
//    selectedAccount = null;
//  }

window.convertDataFormat = async function convertDataFormat(inputData,fontFamily) {

  const lines = inputData.split('\n');
  const convertedOutput = [];

  let currentType = '';
  let currentData = {};

  for (const line of lines) {
      const trimmedLine = line.trim();
      // console.log("trimemd line is ",trimmedLine)

      if (trimmedLine.startsWith('-- ftd.type ')) {

        const regex = /-- ftd\.type ([^:]+):/; 
        const match = trimmedLine.match(regex); 
        if (match && match[1]) {
          const extractedValue = match[1];
          /* console.log("Extracted value:", extractedValue); */
          currentData = { type: extractedValue };
        } else {
          /* console.log("Pattern not found or value not extracted."); */
        }   
      } else if (trimmedLine.startsWith('letter-spacing.px:')) {
          currentData['letter-spacing'] = `${getValueFromLine(trimmedLine)}px`;
      } else if (trimmedLine.startsWith('line-height.px:')) {
          currentData['line-height'] =`${getValueFromLine(trimmedLine)}px`;
      } else if (trimmedLine.startsWith('size.px:')) {
          currentData['size'] = `${getValueFromLine(trimmedLine)}px`;
      } else if (trimmedLine.startsWith('weight:')) {
          currentData['weight'] = parseInt(getValueFromLine(trimmedLine));
          convertedOutput.push(currentData);
          currentData = { type: currentType };
      }
      currentData['font-family'] = fontFamily;
  }

 return convertedOutput;
}

function getValueFromLine(line) {
  return line.split(':')[1].trim();
}
