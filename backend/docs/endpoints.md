# Backend Endpoints

## userInfo
```JSON
{
    "token": "70Mv9hV2R5bDLMT5QV5gCIeUFDe2"
}
```

## createTask
```JSON
{
    "token": "70Mv9hV2R5bDLMT5QV5gCIeUFDe2",
    "task": {
        "description": "bench press x bajillion",
        "frequency": "Daily",
        "title": "Working out so I can be jacked for some reason"
    },
    "goalId":"fjuGV2hkG2vbCERyMcV6"
}
```

## createGoal
```JSON
{
    "token": "70Mv9hV2R5bDLMT5QV5gCIeUFDe2",
    "goal": {
        "description": "i am going to eat pie soon",
        "frequency": "Weekly",
        "title": "goal 2 be deleted"
    }
}
```

## deleteTask
```JSON
{
    "token": "70Mv9hV2R5bDLMT5QV5gCIeUFDe2",
    "taskId": "AH5o2DRribIymzecoO80"
}
```

## deleteGoal
```JSON
{
    "token": "70Mv9hV2R5bDLMT5QV5gCIeUFDe2",
    "goalId": "2XaKh6FsnunxjV3buIkG"
}
```

## editTask
```JSON
{
    "token": "70Mv9hV2R5bDLMT5QV5gCIeUFDe2",
    "taskId": "g2lzu5B0ZyDm4ux70DzA",
    "fieldToChange": "title",
    "newValue": "my third edited task"
}
```

## addComment
```JSON
{
    "token": "70Mv9hV2R5bDLMT5QV5gCIeUFDe2",
    "data": {
            "postId": "4jaZzsAb5XRVwe4zs31J",
            "comment": "This is my second sample comment!"
        }
}
```

## deleteComment
```JSON
{
    "token": "70Mv9hV2R5bDLMT5QV5gCIeUFDe2",
    "data": {
            "postId": "4jaZzsAb5XRVwe4zs31J",
            "commentId": "vXlUaYnhe0iGU9wPtb2f"
        }
}
```

## editGoal
```JSON
{
    "token": "70Mv9hV2R5bDLMT5QV5gCIeUFDe2",
    "goalId": "5yaEBmLmFAWmhld1FDMi",
    "fieldToChange": "description",
    "newValue": "They will perish."
}
```

## getUserTasks
```JSON
{
    "token": "70Mv9hV2R5bDLMT5QV5gCIeUFDe2"
}
```

## getGoalTasks
```JSON
{
    "token": "70Mv9hV2R5bDLMT5QV5gCIeUFDe2",
    "goalId": "fjuGV2hkG2vbCERyMcV6 "
}
```

## getUserGoals
```JSON
{
    "token": "70Mv9hV2R5bDLMT5QV5gCIeUFDe2"
}
```

## addChallenge
```JSON
{
    "token": "70Mv9hV2R5bDLMT5QV5gCIeUFDe2",
    "data": {
        "title": "Clean up 1000 homes",
        "description": "Using our new Mr. Clean magic eraser!",
        "goal": 1000,
        "unit": "km",
        "startDate": "3/05/2025",
        "endDate": "5/05/2025"
    }
}
```

## addUserToChallenge
```JSON
{
    "token": "6YiMTawgQlStxfG2ysMkkkQ4c2s2",
    "challengeId": "XdGyBQxDAHZMdNXc5f8e"
}
```

## removeUserFromChallenge
```JSON
{
    "token": "6YiMTawgQlStxfG2ysMkkkQ4c2s2",
    "challengeId": "XdGyBQxDAHZMdNXc5f8e"
}
```

## getChallengeInfo
```JSON
{
    "token": "6YiMTawgQlStxfG2ysMkkkQ4c2s2",
    "challengeId": "XdGyBQxDAHZMdNXc5f8e"
}
```

## deleteChallenge
```JSON
{
    "token": "6YiMTawgQlStxfG2ysMkkkQ4c2s2",
    "challengeId": "1Q1sUPfPHZTkyFtjIW5b"
}
```

## createInvite
```JSON
{
    "token": "70Mv9hV2R5bDLMT5QV5gCIeUFDe2",
    "data": {
        "invitee": "6YiMTawgQlStxfG2ysMkkkQ4c2s2",
        "type": 0, // 0 for friends, 1 for challenges
        "targetId": "3" // This is optional and only required for challenge invites
    }
}
```
## acceptInvite
```JSON
{
    "token": "70Mv9hV2R5bDLMT5QV5gCIeUFDe2",
    "data": {
        "invitee": "6YiMTawgQlStxfG2ysMkkkQ4c2s2",
        "type": 1, // 0 for friends, 1 for challenges
        "inviteId": "hTJ90IGq82sXkIvlHDS2",
        "targetId": "yVCM7S2FTkIIutATJEYx" // This is optional and only used for the challenges invites
    }
}
```
## declineInvite
```JSON
{
    "token": "70Mv9hV2R5bDLMT5QV5gCIeUFDe2",
    "data": {
        "inviteId": "rc2KLH6qa5ykkZKpkY9W"
    }
}
```

## getUserInvites
```JSON
{
    "token": "6YiMTawgQlStxfG2ysMkkkQ4c2s2"
}
```