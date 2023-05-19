public with sharing class FixedDepositTriggerHandler {
    
    //Story-7:
    public static void populateRelationshipOfficer(List<FD_Details__c> fdList){
        /* Step-1: create an empty set to collect the Branch Names in picklist.
           Then, prepare a for each loop, grap the bracnhes and add them to the set above.
        */
        Set<String> branchNames = new Set<String>();
        for(FD_Details__c w : fdList){
            if(String.isNotBlank(w.Branch__c)){
               branchNames.add(w.Branch__c); 
            }
        }

        /*  Step-2: query for the Relationship officers(RO) of the related branches from Branch Relationship Officer(BRO) object.
        For example: RO defined for Alabama is Relationship User
        */
        // prepare an empty listed named broList from BRO Object
        List<Branch_Relationship_Officer__c> broList = new List<Branch_Relationship_Officer__c>();
            if(branchNames.size()>0){
                broList = [SELECT Id, Branch_Name__c, Relationship_Officer__c
                           FROM Branch_Relationship_Officer__c
                           WHERE Branch_Name__c IN:branchNames
                           WITH SECURITY_ENFORCED];  // Not all the records: Only the records that run the triggers in the Set collection above.
            }


            /* Step-3: Prepare a map to hold the Branch Name as key and Relationship officer as value.
            key:Branch value: Relationship officer => (Alabama, Relationship User)
            */
            Map<String,String> branchOfficers = new Map<String,String>();
            for(Branch_Relationship_Officer__c w : broList ){
                String BranchName = w.Branch_Name__c;
                String RelationshipOfficer = w.Relationship_Officer__c;
                branchOfficers.put(BranchName, RelationshipOfficer);
            }

            for(FD_Details__c w : fdList){
                if(String.isNotBlank(w.Branch__c)){
                    w.Relationship_Officer__c = branchOfficers.get(w.Branch__c);
                }
                //get(key) map method returns the value to which the specifed key is mapped or null if the map does not contain that key value.
            }
    }

    //Story-8: After insert event because the record Id has not been created at the before insert event.
    public static void shareWithRelationshipOfficer(List<FD_Details__c> fdList){
        //step-1: create an emtpy list to hold the FD_Details__Share Object because I am going to create an FD_Details__share Object instance.
       // then 
        List<FD_Details__Share> fdShare = new List<FD_Details__Share>();
        for(FD_Details__c w : fdList){
            if(String.isNotBlank(w.Relationship_Officer__c) && w.OwnerId != w.Relationship_Officer__c){
                //Step-2: Create an instance for FD_Details__Share Object then assign/create the required 4 fields(Any share objects do have these four fields as required.)
                Fd_Details__Share fds = new Fd_Details__Share();
                fds.ParentId = w.Id;
                fds.UserOrGroupId = w.Relationship_Officer__c;
                fds.AccessLevel = 'Read';
                fds.RowCause = 'Manual';
                fdShare.add(fds);
            }
        }
        //Step-3: Basically, give the reead permisison to the user by inserting/creating the FD_Details__Share object.
        // regular DML operation insert fdShare;
        Database.insert(fdShare, false);

    }


    //Story-8 : Second Part: What happends when the customer moves to another state: New Relationship Officer and Old Relationship Officer?
    /* Steps: 1. Give the permission(Create the FD_Details__Share) to the new Relationship Officer. We will do the same approach when we create the record in above code.
                  2. Delete the permission(Delete the FD_Details__Share) object for the old(Previous) Relationship Officer.
                  Actions: I need two empty list to hold the step1 and step2 records then do the DML.
        */
    public static void shareWithRelationshipOfficerAfterUpdate(List<FD_Details__c> fdList, Map<Id,FD_Details__c> fdOldMap){
        List<FD_Details__Share> fdShareNewRO = new List<FD_Details__Share>();
        List<FD_Details__Share> fdDeleteOldRO = new List<FD_Details__Share>();
        for(FD_Details__c w : fdList){
            if(String.isNotBlank(w.Relationship_Officer__c) && w.Relationship_Officer__c != fdOldMap.get(w.Id).Relationship_Officer__c){
                FD_Details__Share fdsMethod = createShareInstance(w.Id, w.Relationship_Officer__c);
                fdShareNewRO.add(fdsMethod);

                //The new RO has given the permission now lets delete the old RO permisison.
                List<FD_Details__Share> fdsOld = [SELECT id, RowCause, AccessLevel, UserOrGroupId, ParentId
                FROM FD_Details__Share
                WHERE ParentId =:w.Id AND UserOrGroupId =:fdOldMap.get(w.Id).Relationship_Officer__c
                AND RowCause=: 'Manual'];

                if(fdsOld != null){
                    fdDeleteOldRO.addAll(fdsOld);
                }
            }
        }

        //All the DML's must be done outside of the for loops.
        Database.insert(fdShareNewRO, false);  //sharing the Record. Giving the Read Permission basically.
        Database.delete(fdDeleteOldRO, false); //Taking back the permission from the old RO which means deleting the FD_Details_Share object record.     
    }

    //Create a provate method to create your FD_Details__Share instance Object.
    private static FD_Details__Share createShareInstance(String parentId, String userOrGroupId){
        FD_Details__Share fds = new FD_Details__Share();
            fds.ParentId = parentId;
            fds.UserOrGroupId = userOrGroupId;
            fds.AccessLevel = 'Read';
            fds.RowCause = 'Manual';
            return fds;
    }
}