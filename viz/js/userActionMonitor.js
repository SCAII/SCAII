function getUserActionMonitor() {
    uam = {};

    uam.clickRegionDetails = undefined;
    uam.clickTargetDetails = undefined;
    uam.userActionSemantics = undefined;

    setHandlers();
   

    
    uam.setUserActionSemantics = function(info) {
        if (this.userActionSemantics == undefined) {
            this.userActionSemantics = info;
        }
    }
    uam.regionClick = function(info) {
        if (this.clickRegionDetails == undefined) {
            this.clickRegionDetails = info;
        }
    }
    uam.targetClick = function(info) {
        if (this.clickTargetDetails == undefined) {
            this.clickTargetDetails = info;
        }
    }

    uam.globalClick = function(x,y) {
        var clickText = "userClick:" + x + "_" + y+ ";";
        if (this.clickRegionDetails != undefined) {
            clickText = clickText + this.clickRegionDetails + ";";
            clickReqionDetails = undefined;
        }
        else {
            clickText = clickText + "NA;";
        }

        if (this.clickTargetDetails != undefined) {
            clickText = clickText + this.clickTargetDetails + ";";
            clickTargetDetails = undefined;
        }
        else {
            clickText = clickText + "NA;";
        }
        
        if (this.userActionSemantics != undefined) {
            clickText = clickText + this.userActionSemantics;
            userActionSemantics = undefined;
        }
        else {
            clickText = clickText + "NA";
        }
        console.log("clickText... " + clickText);
        stateMonitor.setUserAction(clickText);
        
        this.clickRegionDetails = undefined;
        this.clickTargetDetails = undefined;
        this.userActionSemantics = undefined;
    }
    return uam;
}

function globalClickHandler(e) {
    userActionMonitor.globalClick(e.clientX, e.clientY);
}

function regionClickHandlerSaliency(e) { userActionMonitor.regionClick("region:saliency;");}
function regionClickHandlerRewards(e)  { userActionMonitor.regionClick("region:rewards"  );}
function regionClickHandlerGameArea(e) { userActionMonitor.regionClick("region:gameArea");}
function regionClickHandlerQnAArea(e)  { userActionMonitor.regionClick("region:QnA"     );}

function targetClickHandler(e, userActionSemantics) {
    if (isStudyQuestionMode()){
        var targetId = e.currentTarget.getAttribute("id");
        userActionMonitor.targetClick("target:" + targetId);
        userActionMonitor.setUserActionSemantics(userActionSemantics);
    }
}

function setHandlers() {
    $("#scaii-interface")         .on("click",globalClickHandler);
    $("#scaii-explanations")      .on("click",regionClickHandlerSaliency);
    $("#rewards-titled-container").on("click",regionClickHandlerRewards);
    $("#game-titled-container")   .on("click",regionClickHandlerGameArea);
    $('#q-and-a-div')             .on("click",regionClickHandlerQnAArea);
    $("#scaii-acronym")           .on("click",function(e) {targetClickHandler(e,"touchAcronym:NA");});
    $("#game-replay-label")       .on("click",function(e) {targetClickHandler(e,"touchReplayingGameFileLabel:NA");});
    $("#replay-file-selector")    .on("click",function(e) {targetClickHandler(e,"touchReplayFileSelector:NA");});
    $("#step-value")              .on("click",function(e) {targetClickHandler(e,"touchStepProgressLabel:NA");});

    
}
function getShapeLogString(isFriend, type,hitPoints, maxHitPoints){
    var result;
    if (isFriend){
        result = "friendly_";
    }
    else {
        result = "enemy_";
    }
    result = result + type + "_" + hitPoints + "_" + maxHitPoints;
    return result;
}