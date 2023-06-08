public with sharing class ApplicantDetails1 {
    
    //create a wrapper class.
    public class ApplicantWrapper{
        @AuraEnabled
        public List<FD_Applicant_Junction__c> appJuncList;

        @AuraEnabled
        public Boolean isSuccess;

        @AuraEnabled
        public String errorMessage;

    }
     
    @AuraEnabled

    //Create an instance of your wrapper class above.
   
    public static ApplicantWrapper saveRecords(Applicant_Details__c objAppl, String fdId, String applType){
        ApplicantWrapper objectWrapper = new ApplicantWrapper();

        List<Applicant_Details__c> appList = [SELECT Id FROM Applicant_Details__c WHERE SSN__C =:objAppl.SSN__c];
            if(!appList.isEmpty()){
                objAppl.id = appList[0].id;
            }
            upsert objAppl;
        List<FD_Applicant_Junction__c> juncRecords = [SELECT Id FROM FD_Applicant_Junction__c 
                                                      WHERE FD_Details__C =: fdId AND Applicant_Details__c =:objAppl.id];

         objectWrapper.isSuccess = true;
         objectWrapper.errorMessage = ''; //created wrapper fields and put date in them.
         
         //if there is an already junction record related with the current FD details record, it will be false. I do not want the system to create another one.
         if(!juncRecords.isEmpty()){
            objectWrapper.isSuccess = false;
            objectWrapper.errorMessage = 'There is an already junction record related with the current FD details record. You can not add another one.';
         } else if (objectWrapper.isSuccess){ // if there is No junction record, then returns true and creates one here. Lets create now!
            //In order to create this Junction record, first you need to get its instance.
            FD_Applicant_Junction__c junctionInstance = new FD_Applicant_Junction__c();
            junctionInstance.FD_Details__c = fdId; //recordId. I have been in FD Details since the beginning.
            junctionInstance.Applicant_Details__c = objAppl.id;// I have created/updated my applicnat details so I have the id as well. I have pass these two.
            junctionInstance.Type__c = applType; // At the very beginning. I selected the type of the applicant details. it is either primary Applicant or Nominee. I pass it now here.

            insert junctionInstance;  //finally i Inserted it.

         }

            return objectWrapper;
    }
}