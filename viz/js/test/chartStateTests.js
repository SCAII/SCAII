///Jed and Evan agree that render state at each DP should be retained and revived if revisit.
// so replay state remembers cm for each DP


//___which bars/actions to show? show everything, allow remove stuff.
//___pin tooltips so can hover over text and show another layer
//___reward bars - at display time, add the current score to the total so far
//___total bar - semi-transparent across other bars

function runChartManagerTests(failureChecker) {
    var fc = failureChecker;

    //var chartData = getChartData();
    fc.setTestName("chartManagerTest");
    var cm;
    { // defaults checks
        fc.setCase("normal mode defaults check");
        //cm = getChartManager(chartData);
        cm = getChartManager();
        cm.setUserStudyMode(false);
        fc.assert(cm.userStudyTreatment, "NA", "userStudyTreatment");
        
        fc.assert(cm.showChartAccessButton, true, "showChartAccessButton");// NEW_CHART treatment1 shows saliency but not rewards so can't rely on the "what was relevant" button
        fc.assert(cm.chartVisible, false, "chartVisible");
        
        fc.assert(cm.showSaliencyAccessButton, true, "showSaliencyAccessButton");
        fc.assert(cm.saliencyVisible, false, "saliencyVisible");
        fc.assert(cm.saliencyCombined, true, "saliencyCombined");
        cm.render("trace");
        fc.assert(cm.renderLog.length, 1,"renderLog.length");
        fc.assert(cm.renderLog[0], "renderChartAccessButton", "renderLog[0]");
    
        //
        fc.setCase("user study mode T0 defaults check");
        //cm = getChartManager(chartData);
        cm = getChartManager();
        cm.setUserStudyMode(true);
        cm.setUserStudyTreatment("T0");
        
        fc.assert(cm.showChartAccessButton, false, "showChartAccessButton");
        fc.assert(cm.chartVisible, false, "chartVisible");
        
        fc.assert(cm.showSaliencyAccessButton, false, "showSaliencyAccessButton");
        fc.assert(cm.saliencyVisible, false, "saliencyVisible");
        fc.assert(cm.saliencyCombined, true, "saliencyCombined");
        cm.render("trace");
        fc.assert(cm.renderLog.length, 0,"renderLog.length");

        //
        fc.setCase("user study mode T1 defaults check");
        //cm = getChartManager(chartData);
        cm = getChartManager();
        cm.setUserStudyMode(true);
        cm.setUserStudyTreatment("T1");
        
        fc.assert(cm.showChartAccessButton, false, "showChartAccessButton");
        fc.assert(cm.chartVisible, false, "chartVisible");
        
        fc.assert(cm.showSaliencyAccessButton, false, "showSaliencyAccessButton");
        fc.assert(cm.saliencyVisible, true, "saliencyVisible");
        fc.assert(cm.saliencyCombined, false, "saliencyCombined");
        cm.render("trace");
        fc.assert(cm.renderLog.length, 1,"renderLog.length"); 
        fc.assert(cm.renderLog[0], "renderSaliencyDetailed", "renderLog[0]");

        //
        fc.setCase("user study mode T2 defaults check");
        //cm = getChartManager(chartData);
        cm = getChartManager();
        cm.setUserStudyMode(true);
        cm.setUserStudyTreatment("T2");
        
        fc.assert(cm.showChartAccessButton, true, "showChartAccessButton");
        fc.assert(cm.chartVisible, false, "chartVisible");
        
        fc.assert(cm.showSaliencyAccessButton, false, "showSaliencyAccessButton");
        fc.assert(cm.saliencyVisible, false, "saliencyVisible");
        fc.assert(cm.saliencyCombined, false, "saliencyCombined");
        cm.render("trace");
        fc.assert(cm.renderLog.length, 1,"renderLog.length"); 
        fc.assert(cm.renderLog[0], "renderChartAccessButton", "renderLog[0]");

        //
        fc.setCase("user study mode T3 defaults check");
        //cm = getChartManager(chartData);
        cm = getChartManager();
        cm.setUserStudyMode(true);
        cm.setUserStudyTreatment("T3");
        
        fc.assert(cm.showChartAccessButton, true, "showChartAccessButton");
        fc.assert(cm.chartVisible, false, "chartVisible");
        
        fc.assert(cm.showSaliencyAccessButton, true, "showSaliencyAccessButton");
        fc.assert(cm.saliencyVisible, false, "saliencyVisible");
        fc.assert(cm.saliencyCombined, true, "saliencyCombined");
        cm.render("trace");
        fc.assert(cm.renderLog.length, 1,"renderLog.length"); 
        fc.assert(cm.renderLog[0], "renderChartAccessButton");
    }

    { // non user study mode
        fc.setCase("non user study mode");
        //cm = getChartManager(chartData);
        cm = getChartManager();
        cm.setUserStudyMode(false);
        fc.assert(cm.showLosingActionSmaller,false,"losing actions saliency map size");
        cm.filename = "foo.scr"; 
        
        cm.chartVisible = true;
        cm.render("trace");
        fc.assert(cm.renderLog.length, 3,"renderLog.length.a"); 
        fc.assert(cm.renderLog[0], "renderChartAccessButton", "renderLog[0]a");
        fc.assert(cm.renderLog[1], "renderChartDetailed", "renderLog[1]a");
        fc.assert(cm.renderLog[2], "renderSaliencyAccessButton", "renderLog[2]a");

        cm.saliencyVisible = true;
        cm.render("trace");
        fc.assert(cm.renderLog.length, 4,"renderLog.length.c"); 
        fc.assert(cm.renderLog[0], "renderChartAccessButton", "renderLog[0]c");
        fc.assert(cm.renderLog[1], "renderChartDetailed", "renderLog[1]c");
        fc.assert(cm.renderLog[2], "renderSaliencyAccessButton", "renderLog[2]c");
        fc.assert(cm.renderLog[3], "renderSaliencyCombined", "renderLog[3]c");

        cm.saliencyCombined = false;
        cm.render("trace");
        fc.assert(cm.renderLog.length, 4,"renderLog.length.d"); 
        fc.assert(cm.renderLog[0], "renderChartAccessButton", "renderLog[0]d");
        fc.assert(cm.renderLog[1], "renderChartDetailed", "renderLog[1]d");
        fc.assert(cm.renderLog[2], "renderSaliencyAccessButton", "renderLog[2]d");
        fc.assert(cm.renderLog[3], "renderSaliencyDetailed", "renderLog[3]d");

        fc.assert(cm.showHoverScores, true, "saliency hover scores");
    }

    { // T1
        fc.setCase("T1");
        //cm = getChartManager(chartData);
        cm = getChartManager();
        cm.setUserStudyMode(true);
        cm.setUserStudyTreatment("T1");

        cm.setFilename("tutorial.scr"); 
        fc.assert(cm.saliencyRandomized, true, "saliency randomization");
        cm.setFilename("MainTask.scr"); 
        fc.assert(cm.saliencyRandomized, false, "saliency randomization");
        fc.assert(cm.showLosingActionSmaller,true,"losing actions saliency map size");
        fc.assert(cm.showHoverScores, false, "saliency hover scores");
    }
    
    { // T2
        fc.setCase("T2");
        //cm = getChartManager(chartData);
        cm = getChartManager();
        cm.setUserStudyMode(true);
        cm.setUserStudyTreatment("T2");
        fc.assert(cm.showLosingActionSmaller,true,"losing actions saliency map size");

        cm.chartVisible = true;
        cm.render("trace");
        fc.assert(cm.renderLog.length, 2,"renderLog.length.a"); 
        fc.assert(cm.renderLog[0], "renderChartAccessButton", "renderLog[0]a");
        fc.assert(cm.renderLog[1], "renderChartDetailed", "renderLog[1]a");
    }

    { // T3
        fc.setCase("T3");
        //cm = getChartManager(chartData);
        cm = getChartManager();
        cm.setUserStudyMode(true);
        cm.setUserStudyTreatment("T3");
        fc.assert(cm.showLosingActionSmaller,true,"losing actions saliency map size");

        fc.assert(cm.showHoverScores, false, "saliency hover scores");
        cm.chartVisible = true;
        cm.render("trace");
        fc.assert(cm.renderLog.length, 3,"renderLog.length.a"); 
        fc.assert(cm.renderLog[0], "renderChartAccessButton", "renderLog[0]a");
        fc.assert(cm.renderLog[1], "renderChartDetailed", "renderLog[1]a");
        fc.assert(cm.renderLog[2], "renderSaliencyAccessButton", "renderLog[2]a");

        cm.saliencyVisible = true;
        cm.render("trace");
        fc.assert(cm.renderLog.length, 4,"renderLog.length.c"); 
        fc.assert(cm.renderLog[0], "renderChartAccessButton", "renderLog[0]c");
        fc.assert(cm.renderLog[1], "renderChartDetailed", "renderLog[1]c");
        fc.assert(cm.renderLog[2], "renderSaliencyAccessButton", "renderLog[2]c");
        fc.assert(cm.renderLog[3], "renderSaliencyCombined", "renderLog[3]c");

        cm.saliencyCombined = false;
        cm.render("trace");
        fc.assert(cm.renderLog.length, 4,"renderLog.length.d"); 
        fc.assert(cm.renderLog[0], "renderChartAccessButton", "renderLog[0]d");
        fc.assert(cm.renderLog[1], "renderChartDetailed", "renderLog[1]d");
        fc.assert(cm.renderLog[2], "renderSaliencyAccessButton", "renderLog[2]d");
        fc.assert(cm.renderLog[3], "renderSaliencyDetailed", "renderLog[3]d");
    }
}