// serve with `python -m SimpleHTTPServer 8000`
// http://localhost:8000

function onSpreadsheetDownloaded(response) {
    const birthDay = new Date("1983-08-24"); // TODO read from input field
    const currentDate = new Date();
    const currentAgeInYears = new Date(currentDate - birthDay).getFullYear() - 1970;
    const birthYear = birthDay.getFullYear();

    if(birthYear < 1923 || birthYear > 2023) {
        throw new Error(`Birth year must be in range [1923, 2023], was ${birthYear}`);
    }

// discover
//    for(sheetName in workbook.SheetNames) {
//        console.log(sheetName, typeof sheetName); // should be ["Titel", ...] - but is ["0", ...] !?
//    }

    console.log(`loading spreadsheet data`)
    const workbook = XLSX.read(response);
    console.log("workbook", workbook, typeof workbook);

    console.log("birthDay", birthDay, "birthYear", birthYear, "currentDate", currentDate, "currentAgeInYears", currentAgeInYears)

    const sheet = workbook.Sheets["12621-05"];

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

    const maxRowIndex = rowIndexForCompletedYears0 + 100;

    // odds to be alive
    var survivalChance = [];
    survivalChance[currentAgeInYears] = 1;

    console.log(survivalChance);
    for(var thisRowIndex = startRowIndex + 1; thisRowIndex <= maxRowIndex; thisRowIndex++) {
        console.log("thisRowIndex", thisRowIndex);

        const thisYearsAge = thisRowIndex - rowIndexForCompletedYears0;
        console.log("thisYearsAge", thisYearsAge);

        const lastYearsAge = thisYearsAge - 1;
        console.log("lastYearsAge", lastYearsAge);
        const lastYearsOdds = survivalChance[lastYearsAge];
        console.log("lastYearsOdds", lastYearsOdds);

        const thisCellAddress = XLSX.utils.encode_cell({c: columnIndexForMyBirthYear, r: thisRowIndex});
        console.log("thisCellAddress", thisCellAddress)
        const thisYearsOdds = lastYearsOdds * (1 - sheet[thisCellAddress].v);
        console.log("thisYearsOdds", thisYearsOdds)

        survivalChance[thisYearsAge] = thisYearsOdds;
    }
    console.log(survivalChance);
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

downloadSpreadsheet();
