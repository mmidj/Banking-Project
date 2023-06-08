import { LightningElement, api, wire } from 'lwc';
import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import META_DATA_JUNCTION_OBJECT from '@salesforce/schema/FD_Applicant_Junction__c';
import APPLICANT_TYPES_FIELD from '@salesforce/schema/FD_Applicant_Junction__c.Type__c';
import SAVE_RECORDS_APEX from '@salesforce/apex/ApplicantDetails1.saveRecords';


export default class AddApplicants extends LightningElement {

   @api recordId;
   selectedApplicantType; // only selected pickList value
   applicantTypeOptions = []; //all pickList values

   showAddApplicant = false;  //  it is my switch to open/close the second part and disable my button. button is not disabled at the beginning.
   listApplicants = []; //this will hold the records coming from database
   objApplicant = {}; //this will hold the entered data in object format.

   //Applicant Type Combo Box

   @wire(getObjectInfo, {objectApiName : META_DATA_JUNCTION_OBJECT})
   intermediateWiredData;


   @wire(getPicklistValues, {recordTypeId:'$intermediateWiredData.data.defaultRecordTypeId',fieldApiName:APPLICANT_TYPES_FIELD})
   wiredTypeField({data,error}){
    if(data){
       console.log(data);
       let options = [];
       data.values.forEach(element =>{
        options.push({ label: element.label, value: element.value});
       })
       this.applicantTypeOptions = options;
       console.log('The Applicant Type options are : '+JSON.stringify(this.applicantTypeOptions));
    }
    if(error){
        console.log(error);
    }

   }

   applicantTypeChangeHandler(event){
        this.selectedApplicantType = event.detail.value;
        console.log('Select applicant type is: '+ this.selectedApplicantType);
   }

   //the add applicant button
   addApplicant(){
    let isValid = true;
    let inputFields = this.querySelectorAll('.validateCombobox');
    inputFields.forEach(inputField=>{
        if(!inputField.checkValidity()){
            inputField.reportValidity();
            isValid = false;
        }
    });
    if(isValid){
        this.showAddApplicant = true;
    }
   }

   /*  objApplicant ={
            Firstname__c : 'Alex',
            Lastname__c : 'Torres',
            SSN__c : 12345,
            DateOfBirth__c : 09/03/2000,
            Mobile__c : '4563322',
            Email__c : 'test@test.com,
            Address__c : '123 street, Houston,TX,34506   
   }
   */

   //Lets work on the second part add applicants fields
   FirstNameChangeHandler(event){
     this.objApplicant.Firstname__c = event.target.value;
   }
   LastNameChangeHandler(event){
    this.objApplicant.Lastname__c = event.target.value;
   }
   SSNChangeHandler(event){
    this.objApplicant.SSN__c = event.target.value;
   }
   dobChangeHandler(event){
    this.objApplicant.DateOfBirth__c = event.target.value;
   }
   mobileChangeHandler(event){
    this.objApplicant.Mobile__c = event.target.value;
   }
   emailChangeHandler(event){
    this.objApplicant.Email__c = event.target.value;
   }
   addressChangeHandler(event){
    this.objApplicant.Address__c = event.target.value;
   }

   //Save Button
   saveHandler(){
    //validate inputs
    let isValid = true;
    // let inputFields = this.querySelectorAll('lightning-input');
    // inputFields.forEach(inputField=>{
    //     if(!inputField.checkValidity()){
    //         inputField.reportValidity();
    //         isValid = false;
    //     }
    // });
    // let addressField = this.querySelectorAll('lightning-textarea');
    //     if(!addressField.checkValidity()){
    //         addressField.reportValidity();
    //         isValid = false;
    //     };

    //saving operation --> Go and create an Apex Class
    if(isValid){
        SAVE_RECORDS_APEX({
            objAppl : this.objApplicant,
            fdId : this.recordId,
            applType : this.selectedApplicantType
        }).then(result =>{
            if(result){
                 this.listApplicants = result.appList
                 console.log(this.listApplicants);
                 //create success message-ShowToastEvent
                 const successEvent = new ShowToastEvent({
                    title : 'Success!!!',
                    variant : 'success',
                    message : 'Congratulations, you have saved your record' 
                 });
                 this.dispatchEvent(successEvent);
            }
        }).catch(error => {
            console.log ('Error details :'+ JSON.stringify(error));
            //create error message-ShowToastEvent
            const errorEvent = new ShowToastEvent({
                title : 'Error!!!!',
                variant : 'error',
                message : 'Error Occurred, please check your code'+ JSON.stringify(error)
             });
             this.dispatchEvent(errorEvent);
        })
    }



   }

   closeHandler(){
    this.showAddApplicant = false;
   }



}