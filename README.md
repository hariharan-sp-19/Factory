# Factory - PoC to manage the state of goods in a manufacturing unit 
* The Web app is used to add and manage the goods present in the factory.
* All the goods goes through the phase of Manufacture, Paint Bay, Painted, QA Bay, QA check and Package Bay
* Containers are present to carry these goods from bay to bay which helps us to know the count of each unit of product at what stage
* When each product is transferred from bay to containers using the mobile app and the count of the product will be updated by tagging
  NFC present in the container.
* The Node App will have a dashboard showing all the products with the count at what stage the number of products are present
  - History will logged  at what time how many products are moved from bay to bay, container to container 
  - Products crud will help in add, remove products and manage the count present in the Manufacturing unit.
  
To Run application
- npm install in the web app folder and run app.js
- npm install in the android app folder and add android platform and cordova run android
