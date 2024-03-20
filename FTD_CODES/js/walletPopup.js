// Create a new Web Component for the popup
export class WalletPopup extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    
        // Create the necessary DOM elements
        const popupContent = document.createElement('div');
        popupContent.classList.add('popup-content');
    
        const providersList = document.createElement('ul');
        providersList.classList.add('providers-list');
    
        // Create provider items and add them to the list
        const providerData = [
          { name: 'Metamask', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/MetaMask_Fox.svg/1200px-MetaMask_Fox.svg.png' },
          { name: 'Torus (Sign in with Google)', icon: './images/TorusWallet.svg' }
          // Add more providers as needed
        ];
       
        providerData.forEach((provider) => {
          const providerItem = document.createElement('li');
          providerItem.classList.add('provider-item');
          providerItem.dataset.provider = provider.name.toLowerCase();
    
          const providerIcon = document.createElement('img');
          providerIcon.classList.add('provider-icon');
          providerIcon.src = provider.icon;
          providerIcon.alt = provider.name;
    
          const providerName = document.createTextNode(provider.name);
    
          providerItem.appendChild(providerIcon);
          providerItem.appendChild(providerName);
          providersList.appendChild(providerItem);
        });

        const closeButton = document.createElement('button');
        closeButton.classList.add('close-button');
        closeButton.textContent = 'Close';

    
        popupContent.appendChild(providersList);
        popupContent.appendChild(closeButton);
        this.shadowRoot.appendChild(popupContent);

        closeButton.addEventListener('click', this.hidePopup.bind(this));
 
    
        // Add event listener to provider items
        this.shadowRoot.addEventListener('click', (event) => {
          const providerItem = event.target.closest('.provider-item');
          if (providerItem) {
            const selectedProvider = providerItem.dataset.provider;
            // Open the selected provider or perform any other actions
            console.log('Selected Provider:', selectedProvider);
            connectWalletProvider(selectedProvider);
            // Hide the popup
            this.style.display = 'none';
          }
        });
    
        const style = document.createElement('style');
        style.textContent = `
          /* Styles for the popup */
          :host {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw!important;
            height: 100vh!important;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
          }
    
          /* Styles for the popup content */
          .popup-content {
            background-color: #00011d;
            padding: 20px;
            border-radius: 10px;
            border: 2px solid #D12EEF;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
            width: 80%;
            max-width: 400px;
            text-align: center;
          }
    
          /* Styles for the list of providers */
          .providers-list {
            list-style: none;
            padding: 0;
          }
    
          .provider-item {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            cursor: pointer;
            font-weight: 600;
            font-size: 18px;
            font-family: 'Poppins', sans-serif; /* Poppins font */
            color: white
          }
    
          .provider-item:hover {
            background-color: #D12EEF;
          }
    
          .provider-icon {
            width: 30px;
            height: 30px;
            margin-right: 10px;
          }

          .close-button {
            background-color: #3b4047;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 10px;
            font-size: 14px;
            cursor: pointer;
            margin-top: 10%;
          }
    
          /* Responsive styles */
          @media (max-width: 600px) {
            .popup-content {
              width: 90%;
              max-width: 300px;
            }
          }
        `;
    
        this.shadowRoot.appendChild(style);
      }
    
    
      showPopup() {
        // Show the popup
        this.style.display = 'block';
      }
    
      hidePopup() {
        // Hide the popup
        this.style.display = 'none';
        connectWalletSkipEvent();
      }
  }
  
  // Define the custom element
  customElements.define('wallet-popup', WalletPopup);
