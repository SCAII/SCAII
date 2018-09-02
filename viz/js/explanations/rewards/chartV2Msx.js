function addMsxToBars(rawChartData) {
    var rd = rawChartData;
    rd.colors = ['#7293CB', '#E1974C', '#84BA5B', '#D35E60', '#9067A7', '#AB6857', '#CCC210', '#000044'];
    for (var i in rd.actions) {
        rd.actions[i].msxMaxValueAction = false;
        for (var j in rd.actions[i].bars) {
            rd.actions[i].bars[j].msxColor = "grey";
            rd.actions[i].bars[j].msxImportantBar = false;
        }
    }
    var maxBarGroup = rd.getMaxValueAction();
    for (var i in rd.actions) {
        var action = rd.actions[i];
        if (action.name != maxBarGroup.name) {
            var importantNames = getMinBarAdvantagesRowNBarsPerAction(rd.actions[i], maxBarGroup);
            for (var j in action.bars) {
                var bar = action.bars[j];
                for (var k in importantNames) {
                    var check = importantNames[k];
                    if (bar.fullName == check) {
                        bar.msxImportantBar = true;
                        bar.msxColor = rd.colors[j];
                    }
                }
                
            }
        } else {
            action.msxMaxValueAction = true;
        }
    }
    return rd;
}
function getMinBarAdvantagesRowNBarsPerAction(actions, maxBarGroup) {
    var typeDiff = 0, totalNegDiff = 0, totalPos = 0;
    var posDiff = [];
    var namePosDiff = [];
    for(var i in actions.bars) {
        var bar = actions.bars[i];
        var maxBar = maxBarGroup.bars[i];
        typeDiff = maxBar.value - bar.value;
        if(typeDiff >= 0) {
            posDiff.push(typeDiff);
            totalPos++;
            namePosDiff.push(bar.fullName);
        } else {
            totalNegDiff += Math.abs(typeDiff);
        }
    }
    var finalReturn = (sortRewardDescending(posDiff, totalPos, namePosDiff, totalNegDiff));
    console.log("-------------------------------");
    return finalReturn;
}
function sortRewardDescending(posDiff, totalPos, namePosDiff, totalNegDiff) {
    var temp, swap;
    var importantNames = [];
    for(var i = 0; i < totalPos-1; i++) {
        swap = 0;
        for(var j = 0; j < totalPos - i - 1; j++) {
            if(posDiff[j] < posDiff[j + 1]) {
                temp = posDiff[j];
                posDiff[j] = posDiff[j + 1];
                posDiff[j + 1] = temp;
                nameTemp = namePosDiff[j];
                namePosDiff[j] = namePosDiff[j + 1];
                namePosDiff[j + 1] = nameTemp;
                swap = 1;
            }
        }
        if (swap == 0) { break; }
    }
    var minPos=0;
    for(var i in posDiff) {
        minPos += posDiff[i];
        importantNames.push(namePosDiff[i]);
        if(minPos > totalNegDiff) {
            break;
        }
    }
    if(minPos <= totalNegDiff) {
        console.log("Error: No positive reward minimum to explain total negative rewards");
    }
    console.log("The min needed is: " + minPos);
    return importantNames;
}