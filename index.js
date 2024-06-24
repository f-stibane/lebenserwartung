// serve with `python -m SimpleHTTPServer 8000`
// http://localhost:8000

function getFormValues() {
    console.log(`getting form values`);
    return {
        birthDay: new Date(document.getElementById("birthday").value),
        sex: document.querySelector('input[name="sex"]:checked').value,
        optimism: document.querySelector('input[name="optimism"]:checked').value,
    }
}

function calculate() {
    console.log(`calculating`);
    document.getElementById("calculate").setAttribute("disabled", "disabled");

    const formValues = getFormValues();
    console.log("formValues", formValues);
    const birthDay = formValues.birthDay;
    var sheetIndex = 5;
    if (formValues.sex == "w") sheetIndex += 1;
    if (formValues.optimism == "optimistic") sheetIndex += 2;

    const currentDate = new Date();
    const currentAgeInYears = new Date(currentDate - formValues.birthDay).getFullYear() - 1970;
    const birthYear = birthDay.getFullYear();

    if(birthYear < 1923 || birthYear > 2023) {
        throw new Error(`Birth year must be in range [1923, 2023], was ${birthYear}`);
    }

    const sheetName = `12621-0${sheetIndex}`;
    console.log(`using sheet ${sheetName}`);
    const sheet = window.workbook.Sheets[sheetName];

    const columnIndexForBirthYear1923 = 1
    const rowIndexForCompletedYears0 = 8

    // debug start
    const topLeftContentCell = XLSX.utils.encode_cell({c: columnIndexForBirthYear1923, r: rowIndexForCompletedYears0});
    const cell = sheet[topLeftContentCell];
    const content = cell.v;
    console.log("topLeftContentCell content", content, typeof content);
    // debug end

    const columnIndexForMyBirthYear = birthYear - 1923 + columnIndexForBirthYear1923;
    console.log("columnIndexForMyBirthYear", columnIndexForMyBirthYear)
    const startRowIndex = currentAgeInYears + rowIndexForCompletedYears0;
    console.log("startRowIndex", startRowIndex)

    const startingCell = XLSX.utils.encode_cell({c: columnIndexForMyBirthYear, r: startRowIndex});
    console.log("startingCell address", startingCell);
    console.log("startingCell content", sheet[startingCell].v, typeof sheet[startingCell].v);

    const maxRowIndex = rowIndexForCompletedYears0 + 99;

    // odds to be alive
    var survivalChance = [];
    survivalChance[currentAgeInYears] = 1;

    console.log(survivalChance);
    for(var thisRowIndex = startRowIndex + 1; thisRowIndex <= maxRowIndex; thisRowIndex++) {
//        console.log("thisRowIndex", thisRowIndex);

        const thisYearsAge = thisRowIndex - rowIndexForCompletedYears0;
//        console.log("thisYearsAge", thisYearsAge);

        const lastYearsAge = thisYearsAge - 1;
//        console.log("lastYearsAge", lastYearsAge);
        const lastYearsOdds = survivalChance[lastYearsAge];
//        console.log("lastYearsOdds", lastYearsOdds);

        const thisCellAddress = XLSX.utils.encode_cell({c: columnIndexForMyBirthYear, r: thisRowIndex});
//        console.log("thisCellAddress", thisCellAddress)
        const thisYearsOdds = lastYearsOdds * (1 - sheet[thisCellAddress].v);
//        console.log("thisYearsOdds", thisYearsOdds)

        survivalChance[thisYearsAge] = thisYearsOdds;
    }

    createSurvivalGraph(survivalChance);
    document.getElementById("calculate").removeAttribute("disabled");
}

function onSpreadsheetDownloaded(response) {
    console.log(`loading spreadsheet data`);
    window.workbook = XLSX.read(response);

    document.getElementById("calculate").removeAttribute("disabled");
}

function createSurvivalGraph(survivalChance) {
    console.log(`creating survival graph`);
    const ctx = document.getElementById('survivalGraph');

    const labels = [];
    const data = [];

    survivalChance.forEach(function(e, i) {
        labels.push(i);
        data.push(e * 100);
    });

    console.log("survivalChance", survivalChance);
    console.log("labels", labels);
    console.log("data", data);

    if(window.chart) window.chart.destroy();
    window.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Chance of survival in %',
            data: data,
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
    });

}

function downloadSpreadsheet() {
    // TODO: download from source page; or compress by deleting sheets that are not needed
    const url = "statistischer-bericht-kohortensterbetafeln-5126101239005.xlsx";
    console.log(`downloading ${url}`)

    const req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.responseType = "arraybuffer";

    req.onload = function(e) {
        onSpreadsheetDownloaded(req.response)
    };

    req.send();
}

document.getElementById("calculate").addEventListener("click", function() {calculate()});
downloadSpreadsheet();
