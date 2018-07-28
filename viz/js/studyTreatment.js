function getTreatmentManagerOld(treatment) {
    tm = {};

    tm.showAllSaliencyForTreatment1 = false;
    tm.showSaliencyAll = false;
    tm.showReward = false;

    if (treatment == "0"){
        // keep everything hidden
    }
    else if (treatment == "1"){
        tm.showAllSaliencyForTreatment1 = true;
    }
    else if (treatment == "2"){
        tm.showReward = true;
    }
    else if (treatment == "3"){
        tm.showReward = true;
        tm.showSaliencyAll = true;
    }
    else {
        alert("Invalid treatment specified - consult with study manager");
    }
    return tm;
}