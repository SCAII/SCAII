
function getStateMonitor() {
    sm = {};

    sm.logFileName = undefined;
    sm.sentHeader = false;

    sm.emitLogLine = function() {
        if (this.logFileName != undefined) {
            if (!this.sentHeader) {
                var pkt = new proto.scaii.common.ScaiiPacket;
                var lfeHeader = new proto.scaii.common.LogFileEntry;
                var header = this.getHeader();
                lfeHeader.setEntry(header);
                lfeHeader.setFilename(this.logFileName);
                lfeHeader.setIsLastLine(false);
                pkt.setLogFileEntry(lfeHeader);
                userInfoScaiiPackets.push(pkt);
                this.sentHeader = true;
            }
            var pkt = new proto.scaii.common.ScaiiPacket;
            var lfe = new proto.scaii.common.LogFileEntry;
            var date = this.getDate();
            var time = this.getTime();
            var sec = this.getSecondsSince1970();
            var logLine = this.getStateLogEntry(date, time, sec);
            lfe.setEntry(logLine);
            lfe.setFilename(this.logFileName);
            if (studyQuestionIndexManager.hasMoreQuestions()) {
                lfe.setIsLastLine(false);
            }
            else {
                lfe.setIsLastLine(true);
            }
            pkt.setLogFileEntry(lfe);
            userInfoScaiiPackets.push(pkt);
        }
    }

    sm.getDate = function() {
        var dt = new Date();  
        var month = dt.getMonth()+1;  
        var day = dt.getDate();  
        var year = dt.getFullYear();  
        return month + '-' + day + '-' + year;  
    }
    sm.getTime = function() {
        var d = new Date();
        return d.getHours() + ":"  + d.getMinutes() + ":" + d.getSeconds() + ":" + d.getMilliseconds();
    }

    sm.getSecondsSince1970 = function() {
        var d = new Date();
        return d.getTime();
    }
    //
    // saliency
    //
    sm.combinedSaliency = false;
    sm.detailedSaliency = false;

    sm.showedCombinedSaliency = function(){
        this.combinedSaliency = true;
        this.detailedSaliency = false;
    }
    
    sm.showedDetailedSaliency = function(){
        this.combinedSaliency = false;
        this.detailedSaliency = true;
    }

    
    sm.getSaliencyHeader = function() {
        return "combinedSaliency,detailedSaliency,"
    }
    sm.getSaliencyState = function() {
        return this.combinedSaliency +"," + this.detailedSaliency +",";
    }

    //
    // rewards
    //
    sm.combinedReward = false;
    sm.detailedReward = false;
    sm.combinedAdvantage = false;
    sm.detailedAdvantage = false;

    sm.clearRewards = function() {
        this.combinedReward = false;
        this.detailedReward = false;
        this.combinedAdvantage = false;
        this.detailedAdvantage = false;
    }

    sm.showedCombinedRewards = function() {
        this.clearRewards();
        this.combinedReward = true;
    }
    
    sm.showedDetailedRewards = function() {
        this.clearRewards();
        this.detailedReward = true;
    }
    
    sm.showedCombinedAdvantage = function() {
        this.clearRewards();
        this.combinedAdvantage = true;
    }
    
    sm.showedDetailedAdvantage = function() {
        this.clearRewards();
        this.detailedAdvantage = true;
    }

    sm.getRewardHeader = function() {
        return "combinedReward,detailedReward,combinedAdvantage,detailedAdvantage,"
    }
    sm.getRewardState = function() {
        return this.combinedReward +"," + this.detailedReward +"," + this.combinedAdvantage +"," + this.detailedAdvantage +",";
    }


    //
    //  general
    //
    sm.userAction = undefined;
    sm.questionId = undefined;
    sm.decisionPoint = undefined;

    sm.setUserAction = function(ua) {
        this.userAction = ua;
        this.emitLogLine(); 
    }

    sm.setQuestionId = function(qid) {
        this.questionId = qid;
    }

    sm.setDecisionPoint = function(dp) {
        this.decisionPoint = dp;
    }
    sm.getGeneralHeader = function() {
        return "date,time,secSince1970,decisionPoint,questionId,userAction,";
    }

    sm.getGeneralState = function() {
        return this.decisionPoint + "," + this.questionId + "," + this.userAction + ",";
    }
    //
    // alltogether
    //
    
    sm.getHeader = function() {
        return this.getGeneralHeader() + this.getRewardHeader() + this.getSaliencyHeader();
    }

    sm.getState = function() {
        return this.getGeneralState() + this.getRewardState() + this.getSaliencyState();
    }

    sm.getStateLogEntry = function(date, time, sec) {
        return date + "," + time + ',' + sec + "," + this.getState();
    }
    return sm;
}

function trySetUserAction(s){
    if (isStudyQuestionMode()){
        stateMonitor.setUserAction(s);
    }
}