trigger FixedDepositTrigger on FD_Details__c (before insert, before update, before delete, after insert, after update, after delete, after undelete) {

    if(Trigger.isBefore){
        if(Trigger.isInsert){
            FixedDepositTriggerHandler.populateRelationshipOfficer(Trigger.new);
        }
        if(Trigger.isUpdate){
            FixedDepositTriggerHandler.populateRelationshipOfficer(Trigger.new);
        }
        if(Trigger.isDelete){

        }
    }

    //Data is being saved here


    if(Trigger.isAfter){
        if(Trigger.isInsert){
            FixedDepositTriggerHandler.shareWithRelationshipOfficer(Trigger.new);
        }
        if(Trigger.isUpdate){
            FixedDepositTriggerHandler.shareWithRelationshipOfficerAfterUpdate(Trigger.new, Trigger.oldMap);
        }
        if(Trigger.isDelete){
            
        }
        if(Trigger.isUndelete){

        }
    }
   
}