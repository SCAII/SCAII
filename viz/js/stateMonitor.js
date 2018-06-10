
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
            var logLine = this.getStateLogEntry(date, time);
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
        return "20180607";
    }
    sm.getTime = function() {
        return "noon";
    }
    //
    // saliency
    //
    sm.combinedSaliency = false;
    sm.detailedSaliency = false;

    sm.showCombinedSaliency = function(){
        this.combinedSaliency = true;
        this.detailedSaliency = false;
        this.setUserAction("showCombinedSaliency");
        this.emitLogLine(); 
    }
    
    sm.showDetailedSaliency = function(){
        this.combinedSaliency = false;
        this.detailedSaliency = true;
        this.setUserAction("showDetailedSaliency");
        this.emitLogLine(); 
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

    sm.showCombinedReward = function() {
        this.clearRewards();
        this.combinedReward = true;
        this.setUserAction("showCombinedReward");
        this.emitLogLine(); 
    }
    
    sm.showDetailedReward = function() {
        this.clearRewards();
        this.detailedReward = true;
        this.setUserAction("showDetailedReward");
        this.emitLogLine(); 
    }
    
    sm.showCombinedAdvantage = function() {
        this.clearRewards();
        this.combinedAdvantage = true;
        this.setUserAction("showCombinedAdvantage");
        this.emitLogLine(); 
    }
    
    sm.showDetailedAdvantage = function() {
        this.clearRewards();
        this.detailedAdvantage = true;
        this.setUserAction("showDetailedAdvantage");
        this.emitLogLine(); 
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
        this.setUserAction("showQuestion;" + qid);
        this.emitLogLine(); 
    }

    sm.setDecisionPoint = function(dp) {
        this.decisionPoint = dp;
        this.setUserAction("setDecisionPoint;" + dp);
        this.emitLogLine(); 
    }
    sm.getGeneralHeader = function() {
        return "date,time,decisionPoint,questionId,userAction,";
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

    sm.getStateLogEntry = function(date, time) {
        return date + "," + time + ',' + this.getState();
    }
    return sm;
}

function trySetUserAction(s){
    if (isStudyQuestionMode()){
        stateMonitor.setUserAction(s);
    }
}