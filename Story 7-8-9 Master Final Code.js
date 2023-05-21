public with sharing class FixedDepositTriggerHandler {
    //story-7 BeforeInsert and beforeUpdate
    public static void populateRelationshipOfficer(List<FD_Details__c> fdList){
        //step-1: create an empty set to store the Branch Names from FD_Details__C Object.
        // if there is a branch name in the picklist, add this branch to the Set below.
        Set<String> branchNames = new Set<String>(); 
        for(FD_Details__c w : fdList ){
            if(String.isNotBlank(w.Branch__c)){      
                branchNames.add(w.Branch__c);
            }
        }

        //Step-2: query for the Relationship Officers(RO) of the related Branches from the BRO Custom Object.
        //for example: RO defined for Alabama is "Relationship User" in the BRO Object
        List<Branch_Relationship_Officer__c> broList = new List<Branch_Relationship_Officer__c>();  //empty list to store RO of branches
        if(branchNames.size()>0){
            broList = [SELECT Relationship_Officer__c,Branch_Name__c
                       FROM Branch_Relationship_Officer__c
                       WHERE Branch_Name__c IN:branchNames
                       WITH SECURITY_ENFORCED]; // Not all of the records. Just give me the rcords that run the trigger.So connect branch name to set
        }

        //Step-3: Prepare a map and update your FD_Details__c object RO field.
        //Note: we have two collectiosn and 1st one is coming from FD Details. The 2 one is coming from BRO Object. So we need to match them with key,value structure in a Map. (Key: Branch Name, Value: Relationship Officer)
        Map<String, String> branchOfficers = new Map<String, String>();
        for(Branch_Relationship_Officer__c w : broList ){
            branchOfficers.put(w.Branch_Name__c, w.Relationship_Officer__c);
        }
        //Finally populate the RO field on FD_Details__c Object.
        for(FD_Details__c w : fdList ){
            if(String.isNotBlank(w.Branch__c)){
                w.Relationship_Officer__c = branchOfficers.get(w.Branch__c);
            }
        }

    }

    //story-8 After Insert Event
    public static void shareWithRelationshipOfficer(List<FD_Details__c> fdList){
        //step-1: create an emtpy list to hold the FD_Details__Share Object and iterate your fdList parameter.
        List<FD_Details__Share> fdShare = new List<FD_Details__Share>();
        for(FD_Details__c w : fdList){
            if(String.isNotBlank(w.Relationship_Officer__c) && w.OwnerId != w.Relationship_Officer__c){
                //Step-2: Create an instance for FD_Details__Share object then assign the required 4 fields for FD_Detail__Share Object(Any share Object has the same four fields.)
                // FD_Details__Share fds = new FD_Details__Share();
                // fds.ParentId = w.Id;
                // fds.UserOrGroupId = w.Relationship_Officer__c;
                // fds.AccessLevel = 'Read';
                // fds.RowCause = 'Manual';
                //the below private method does the job of creating the Fd_Details__Share object so I do not need the above commented out codes.
                FD_Details__Share fdsMethod = createShareInstance(w.Id, w.Relationship_Officer__c);
                fdShare.add(fdsMethod);       
            } 
            //story-9: Sales representative was given the recod read access when he is assigned to.
            if(String.isNotBlank(w.Sales_Representative__c) && w.OwnerId != w.Sales_Representative__c){
                FD_Details__Share fdsMethodSR = createShareInstance(w.Id, w.Sales_Representative__c);
                fdShare.add(fdsMethodSR);   
            }

        }
        //insert your fdShare: Basically give the read permission now.
        // insert fdShare; second way of insert
        Database.insert(fdShare, false);
    }

    /*
    Second Part After Update event. What happens if the customer moves to other state(branch)?
    */
    public static void shareWithRelationshipOfficerAfterUpdate(List<FD_Details__c> fdList, Map<Id,FD_Details__c> fdOldMap){
        /* Step-1: Create two lists for DMLs. 1. to store sharing records after update to give permission to the new officer.
        and in the second list, store the removed permissions for the Relationship officer so I can delete them.
        */
        List<FD_Details__Share> fdShareUp = new List<FD_Details__Share>();
        List<FD_Details__Share> fdsOldDateDelete = new List<FD_Details__Share>();
        for(FD_Details__c w : fdList ){
            if(String.isNotBlank(w.Relationship_Officer__c) && w.Relationship_Officer__c != fdOldMap.get(w.Id).Relationship_Officer__c){
                FD_Details__Share fdsMethod = createShareInstance(w.Id, w.Relationship_Officer__c);
                fdShareUp.add(fdsMethod);
                //remove the permission from the old Relationship officer
                List<FD_Details__Share> fdsOld = [SELECT Id, RowCause, AccessLevel,UserOrGroupId,ParentId
                 FROM FD_Details__Share
                 WHERE ParentId =:w.Id AND UserOrGroupId =: fdOldMap.get(w.Id).Relationship_Officer__c
                 AND RowCause = 'Manual'];
                 if(fdsOld !=null){
                    fdsOldDateDelete.addAll(fdsOld);
                 }

            }
            //story-9 NEw Sales Rep will be given the permission and the old Sales rep permission will be taken.
            if(String.isNotBlank(w.Sales_Representative__c) && w.Sales_Representative__c != fdOldMap.get(w.Id).Sales_Representative__c){
                FD_Details__Share fdsMethodSR = createShareInstance(w.Id, w.Sales_Representative__c);
                fdShareUp.add(fdsMethodSR);
                //remove the permission from the old Relationship officer
                List<FD_Details__Share> fdsOld = [SELECT Id, RowCause, AccessLevel,UserOrGroupId,ParentId
                 FROM FD_Details__Share
                 WHERE ParentId =:w.Id AND UserOrGroupId =: fdOldMap.get(w.Id).Sales_Representative__c
                 AND RowCause = 'Manual'];
                 if(fdsOld !=null){
                    fdsOldDateDelete.addAll(fdsOld);
                 }

            }
        }
        Database.insert(fdShareUp, false);
        Database.delete(fdsOldDateDelete, false);

    }

    private static FD_Details__Share createShareInstance(String parentId, String userOrGroupId){
        FD_Details__Share fds = new FD_Details__Share();
            fds.ParentId = parentId;
            fds.UserOrGroupId = userOrGroupId;
            fds.AccessLevel = 'Read';
            fds.RowCause = 'Manual';
            return fds;
    }
}