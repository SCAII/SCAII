chartClickProcessing = false;
rememberedGlobalChartClick = undefined;
function getUserActionMonitor() {
    uam = {};

    uam.clickRegionDetails = undefined;
    uam.clickTargetDetails = undefined;
    uam.userActionSemantics = undefined;
    uam.pendingLogLine = undefined;


    setHandlers();
    deleteUnwantedControls();

    
    uam.setUserActionSemantics = function(info) {
        // only accept the first one in this click event bubbling epoch.
        // this lets us keep the most specific click info
        if (this.userActionSemantics == undefined) {
            this.userActionSemantics = info;
        }
    }
    
    uam.setUserActionHoverSemantics = function(info) {
        // always accept the most recent one
        this.userActionSemantics = info;
    }

    uam.regionClick = function(info) {
        if (this.clickRegionDetails == undefined) {
            this.clickRegionDetails = info;
        }
        if (this.pendingLogLine == undefined) {
            this.pendingLogLine = templateMap["userClick"];
            this.pendingLogLine = this.pendingLogLine.replace("<TARGET>", "NA");
            this.pendingLogLine = this.pendingLogLine.replace("<TARGET_DTL>", "NA");
        }
        this.pendingLogLine = this.pendingLogLine.replace("<REGION>", info);
    }
    uam.targetClick = function(info) {
        if (this.clickTargetDetails == undefined) {
            this.clickTargetDetails = info;
        }
        //EVAN
        this.pendingLogLine = templateMap[info];
        this.pendingLogLine = this.pendingLogLine.replace("<TARGET>", info);
    }
    
    uam.targetHover = function(info) {
        this.clickTargetDetails = info;
    }

    uam.globalClickOld = function(x,y) {
        if (chartClickProcessing) {
            rememberedGlobalChartClick = [x,y];
            return;
        }
        this.pendingLogLine = this.pendingLogLine.replace("<COORD_X>", x);
        this.pendingLogLine = this.pendingLogLine.replace("<COORD_Y>", y);
        
        if (this.clickListener != undefined) {
            this.clickListener.acceptClickInfo(this.pendingLogLine);
        }
        stateMonitor.setUserAction(this.pendingLogLine);
        this.clear();
    }
    uam.globalClick = function(x,y) {
        if (chartClickProcessing) {
            rememberedGlobalChartClick = [x,y];
            userActionMonitor.regionClick("rewards");
            //userActionMonitor.regionClickOld("region:rewards");
            userActionMonitor.compileChartClickEvent();
            return;
        }
        if (this.pendingLogLine == undefined) {
            this.pendingLogLine = templateMap["userClick"];
            this.pendingLogLine = this.pendingLogLine.replace("<TARGET>", "NA");
            this.pendingLogLine = this.pendingLogLine.replace("<TARGET_DTL>", "NA");
        }
        var logLine = this.pendingLogLine.replace("<COORD_X>", x);
        logLine = logLine.replace("<COORD_Y>", y);
        
        logLine = stateMonitor.emitLogLine(logLine);
        this.clear();
    }
    uam.clear = function() {
        this.clickRegionDetails = undefined;
        this.clickTargetDetails = undefined;
        this.userActionSemantics = undefined;
        this.pendingLogLine = undefined;
        rememberedGlobalChartClick = undefined;
    }
    uam.compileChartClickEvent = function(){
        if (rememberedGlobalChartClick == undefined) {
            // this can happend because we can get here without clicking due to the way the chart had to be instrumented
            return;
        }
        var logLine = this.pendingLogLine.replace("<COORD_X>", rememberedGlobalChartClick[0]);
        logLine = logLine.replace("<COORD_Y>", rememberedGlobalChartClick[1]);
        
        if (this.clickListener != undefined) {
            this.clickListener.acceptClickInfo(this.pendingLogLine);
        }
        stateMonitor.setUserAction(logLine);
        this.clear();
    }

    uam.appendClickRegionDetails = function(s) {
        if (this.clickRegionDetails != undefined) {
            s = s + this.clickRegionDetails + ";";
            clickReqionDetails = undefined;
        }
        else {
            var logLine = this.pendingLogLine.replace("<REGION>", "NA");
            s = s + "NA;";
        }
        return logLine; //was: s
    }
    uam.appendClickTargetDetails = function(s) {
        if (this.clickTargetDetails != undefined) {
            s = s + this.clickTargetDetails + ";";
            clickTargetDetails = undefined;
        }
        else {
            var logLine = this.pendingLogLine.replace("<TARGET>", "NA");
            s = s + "NA;";
        }
        return logLine; //was: s
    }

    uam.appendUserActionSemantics = function(s) {
        if (this.userActionSemantics != undefined) {
            s = s + this.userActionSemantics;
            userActionSemantics = undefined;
        }
        else {
            var logLine = this.pendingLogLine.replace("<TARGET_DTL>", "NA");
            s = s + "NA";
        }
        return logLine; //was: s
    }
    uam.forwardHoverEvent = function() {
        var hoverText = "";
        if (this.userActionSemantics != undefined) {
            hoverText = hoverText + this.userActionSemantics;
            userActionSemantics = undefined;
        }
        else {
            hoverText = hoverText + "NA";
        }
        console.log("hoverText... " + hoverText);
        stateMonitor.setUserAction(hoverText);
        
        this.clickRegionDetails = undefined;
        this.clickTargetDetails = undefined;
        this.userActionSemantics = undefined;
    } 

    uam.stepToDecisionPoint = function(dp) {
        var logLine = templateMap["stepIntoDecisionPoint"];
        logLine = logLine.replace("<DP_NUM>", dp)
        stateMonitor.setUserAction(logLine);
    }
    return uam;
}

function globalClickHandler(e) {
    userActionMonitor.globalClick(e.clientX, e.clientY);
}

function regionClickHandlerSaliency(e) { 
    userActionMonitor.regionClick("saliency");
}
function regionClickHandlerRewards(e)  { userActionMonitor.regionClick("rewards");}
function regionClickHandlerGameArea(e) { userActionMonitor.regionClick("gameArea");}
function regionClickHandlerQnAArea(e)  { userActionMonitor.regionClick("QnA");}
function regionClickHandlerSaliencyOld(e) { userActionMonitor.regionClick("region:saliency");}
function regionClickHandlerRewardsOld(e)  { userActionMonitor.regionClick("region:rewards");}
function regionClickHandlerGameAreaOld(e) { userActionMonitor.regionClick("region:gameArea");}
function regionClickHandlerQnAAreaOld(e)  { userActionMonitor.regionClick("region:QnA");}

function targetClickHandlerOld(e, userActionSemantics) {
    if (isStudyQuestionMode()){
        var targetId = e.currentTarget.getAttribute("id");
        userActionMonitor.targetClick("target:" + targetId);
        userActionMonitor.setUserActionSemantics(userActionSemantics);
    }
}

function targetClickHandler(e, logLine) {
    if (isStudyQuestionMode()){
        var targetId = e.currentTarget.getAttribute("id");
        logLine = logLine.replace("<TARGET>", targetId);
        userActionMonitor.pendingLogLine = logLine;
    }
}

function specifiedTargetClickHandlerOld(targetName, userActionSemantics) {
    if (isStudyQuestionMode()){
        userActionMonitor.targetClick("target:" + targetName);
        userActionMonitor.setUserActionSemantics(userActionSemantics);
    }
}

function specifiedTargetClickHandler(targetName, logLine) {
    if (isStudyQuestionMode()){
        logLine = logLine.replace("<TARGET>", targetName);
        userActionMonitor.pendingLogLine = logLine;
    }
}

function chartTargetClickHandlerOld(targetName , userActionSemantics) {
    if (isStudyQuestionMode()){
        userActionMonitor.targetClick("target:" + targetName);
        userActionMonitor.setUserActionSemantics(userActionSemantics);
        userActionMonitor.compileChartClickEvent();
    }
}

function chartTargetClickHandler(targetName , logLine) {
    if (isStudyQuestionMode()){
        logLine = logLine.replace("<TARGET>", targetName);
        userActionMonitor.pendingLogLine = logLine;
        userActionMonitor.compileChartClickEvent();
    }
}

function targetHoverHandlerOld(e, userActionSemantics) {
    if (isStudyQuestionMode()){
        var targetId = e.currentTarget.getAttribute("id");
        userActionMonitor.targetHover("target:" + targetId);
        userActionMonitor.setUserActionHoverSemantics(userActionSemantics);
        userActionMonitor.forwardHoverEvent();
    }
}

function targetHoverHandler(e, logLine) {
    if (isStudyQuestionMode()){
        var targetId = e.currentTarget.getAttribute("id");
        logLine = logLine.replace("<TARGET>", targetId);
        userActionMonitor.pendingLogLine = logLine;
        stateMonitor.setUserAction(logLine);
    }
}

function deleteUnwantedControls(){
    //$("#action-list").empty();
   // $("#action-list").css("height","20px");
}
function setHandlers() {
    $("#scaii-interface")         .on("click",globalClickHandler);
    $("#game-titled-container")   .on("click",regionClickHandlerGameArea);
    $('#q-and-a-div')             .on("click",regionClickHandlerQnAArea);
    $("#scaii-acronym")           .on("click",function(e) {
        var logLine = templateMap["scaii-acronym"];
        logLine = logLine.replace("<TCH_ACRONYM>", "NA");
        targetClickHandler(e, logLine);
        //targetClickHandler(e,"touchAcronym:NA");
    });
    $("#game-replay-label")       .on("click",function(e) {
        var logLine = templateMap["game-replay-label"];
        logLine = logLine.replace("<RPL_GAME_FILE>", "NA");
        targetClickHandler(e, logLine);
        //targetClickHandler(e,"touchReplayingGameFileLabel:NA");
    });
    $("#replay-file-selector")    .on("click",function(e) {
        var logLine = templateMap["game-replay-label-selector"];
        logLine = logLine.replace("<RPL_GAME_SLCTR>", "NA"); 
        targetClickHandler(e, logLine);
        //targetClickHandler(e,"touchReplayFileSelector:NA");
    });
    $("#step-value")              .on("click",function(e) {
        var logLine = templateMap["touch-step-progress-label"];
        logLine = logLine.replace("<RPL_GAME_PRGSS>", "NA");
        targetClickHandler(e, logLine);
        //targetClickHandler(e,"touchStepProgressLabel:NA");
    });
    $("#scaii-interface")         .on("mousemove", function(e) { 
        var div = document.getElementById("explanations-rewards");
        if (div == undefined) { return;}
        var rect = div.getBoundingClientRect();
        var x = e.clientX;
        var y = e.clientY;
        if (x > rect.left && x < rect.right && y > rect.top && y < rect.bottom) {
            chartClickProcessing = true;
        }
        else {
            chartClickProcessing = false;
        }
        
    })
   
}
function getShapeLogString(isFriend, type,hitPoints, maxHitPoints){
    var result;
    if (isFriend){
        result = "friendly-";
    }
    else {
        result = "enemy-";
    }
    //result = result + type + "-" + hitPoints + "-" + maxHitPoints;
    result = result + type;
    return result;
}