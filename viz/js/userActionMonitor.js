chartClickProcessing = false;
rememberedGlobalChartClick = undefined;
function getUserActionMonitor() {
    uam = {};

    uam.clickRegionDetails = undefined;
    uam.clickTargetDetails = undefined;
    uam.userActionSemantics = undefined;
    uam.clickListener = undefined;

    uam.setClickListener = function(cl){
        this.clickListener = cl;
    }

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
    }
    
    uam.targetClick = function(info) {
        if (this.clickTargetDetails == undefined) {
            this.clickTargetDetails = info;
        }
    }
    
    uam.targetHover = function(info) {
        this.clickTargetDetails = info;
    }

    uam.globalClick = function(x,y) {
        if (chartClickProcessing) {
            rememberedGlobalChartClick = [x,y];
            return;
        }
        var clickText = "userClick:" + x + "_" + y+ ";";

       
        clickText = this.appendClickRegionDetails(clickText);
        clickText = this.appendClickTargetDetails(clickText);
        clickText = this.appendUserActionSemantics(clickText);
        
        console.log("clickText... " + clickText);
        if (this.clickListener != undefined) {
            this.clickListener.acceptClickInfo(clickText);
        }
        stateMonitor.setUserAction(clickText);
        this.clear();
    }

    uam.clear = function() {
        this.clickRegionDetails = undefined;
        this.clickTargetDetails = undefined;
        this.userActionSemantics = undefined;
        rememberedGlobalChartClick = undefined;
    }
    uam.compileChartClickEvent = function(){
        if (rememberedGlobalChartClick == undefined) {
            // this can happend because we can get here without clicking due to the way the chart had to be instrumented
            return;
        }
        var clickText = "userClick:" + rememberedGlobalChartClick[0] + "_" + rememberedGlobalChartClick[1]+ ";";
        clickText = this.appendClickRegionDetails(clickText);
        clickText = this.appendClickTargetDetails(clickText);
        clickText = this.appendUserActionSemantics(clickText);
        
        console.log("clickText... " + clickText);
        if (this.clickListener != undefined) {
            this.clickListener.acceptClickInfo(clickText);
        }
        stateMonitor.setUserAction(clickText);
        this.clear();
    }

    uam.appendClickRegionDetails = function(s) {
        if (this.clickRegionDetails != undefined) {
            s = s + this.clickRegionDetails + ";";
            clickReqionDetails = undefined;
        }
        else {
            s = s + "NA;";
        }
        return s;
    }
    uam.appendClickTargetDetails = function(s) {
        if (this.clickTargetDetails != undefined) {
            s = s + this.clickTargetDetails + ";";
            clickTargetDetails = undefined;
        }
        else {
            s = s + "NA;";
        }
        return s;
    }

    uam.appendUserActionSemantics = function(s) {
        if (this.userActionSemantics != undefined) {
            s = s + this.userActionSemantics;
            userActionSemantics = undefined;
        }
        else {
            s = s + "NA";
        }
        return s;
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
        stateMonitor.setUserAction('stepIntoDecisionPoint:' + dp);
    }

    uam.extractClickCoordinatesFromClickEvent =function(logLine){
        //LEFT OFF HERE
    }
    return uam;
}

function globalClickHandler(e) {
    userActionMonitor.globalClick(e.clientX, e.clientY);
}

function regionClickHandlerSaliency(e) { userActionMonitor.regionClick("region:saliency");}
function regionClickHandlerRewards(e)  { userActionMonitor.regionClick("region:rewards"  );}
function regionClickHandlerGameArea(e) { userActionMonitor.regionClick("region:gameArea");}
function regionClickHandlerQnAArea(e)  { userActionMonitor.regionClick("region:QnA"     );}

function targetClickHandler(e, userActionSemantics) {
    if (userStudyMode){
        var targetId = e.currentTarget.getAttribute("id");
        userActionMonitor.targetClick("target:" + targetId);
        userActionMonitor.setUserActionSemantics(userActionSemantics);
    }
}

function specifiedTargetClickHandler(targetName, userActionSemantics) {
    if (userStudyMode){
        userActionMonitor.targetClick("target:" + targetName);
        userActionMonitor.setUserActionSemantics(userActionSemantics);
    }
}


function chartTargetClickHandler(targetName , userActionSemantics) {
    if (userStudyMode){
        userActionMonitor.targetClick("target:" + targetName);
        userActionMonitor.setUserActionSemantics(userActionSemantics);
        userActionMonitor.compileChartClickEvent();
    }
}

function targetHoverHandler(e, userActionSemantics) {
    if (userStudyMode){
        if (userActionMonitor != undefined) {
            var targetId = e.currentTarget.getAttribute("id");
            userActionMonitor.targetHover("target:" + targetId);
            userActionMonitor.setUserActionHoverSemantics(userActionSemantics);
            userActionMonitor.forwardHoverEvent();  
        }
    }
}

function deleteUnwantedControls(){
    //$("#action-list").empty();
   // $("#action-list").css("height","20px");
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
    $("#scaii-interface")         .on("mousemove", function(e) { 
        var div = document.getElementById("explanations-rewards");
        if (div == undefined) { return;}
        var rect = div.getBoundingClientRect();
        var x = e.clientX;
        var y = e.clientY;
        if (x > rect.left && x < rect.right && y > rect.top && y < rect.bottom) {
            chartClickProcessing = true;
            if (rememberedGlobalChartClick != undefined) {
                userActionMonitor.regionClick("region:rewards");
                userActionMonitor.compileChartClickEvent();
            }
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