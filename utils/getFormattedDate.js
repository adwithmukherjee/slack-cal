
//@param: start, end date in ISO form 
const getFormattedDate = (event) => {
    
    const { start,end } = event

    const s = new Date(start)
    const e = new Date(end)

    return `${getDayofWeek(s.getDay())}, ${s.getMonth()+1}/${s.getDate()}, ${s.toLocaleTimeString("en-US", {timeZone: "America/New_York"})} to ${e.toLocaleTimeString("en-US", {timeZone: "America/New_York"})} EST`

     

}

const getDayofWeek = (num)=> {
    switch (num){
        case 1: 
            return "Monday"
        case 2: 
            return "Tuesday"
        case 3: 
            return "Wednesday"
        case 4: 
            return "Thursday"
        case 5: 
            return "Friday"
        case 6: 
            return "Saturday"
        case 0: 
            return "Sunday"
        default: 
            break;
    }
}

module.exports = {
    getFormattedDate
}
