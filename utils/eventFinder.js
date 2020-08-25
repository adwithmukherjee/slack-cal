


/*
* @param-- cal1, cal2 are two sets of events, one from the requestor, one from the attendee : 
*/
const findBusyTimes = (cal1, cal2) => {
    var parsed = [];

    if (cal1){
    for (i = 0; i < cal1.length; i++) {
      //this gets all the start and end dates of the time
      if (cal1[i]["start"]["dateTime"]) {
        var starttime = Date.parse(cal1[i]["start"]["dateTime"]);
        var endtime = Date.parse(cal1[i]["end"]["dateTime"]);
        parsed.push({ start: starttime, end: endtime }); //date.parse is in UTC (so convert to timezone later)
      }
    }   
  }
   if (cal2){

   for (i = 0; i < cal2.length; i++) {
      //this gets all the start and end dates of the time
      if (cal2[i]["start"]["dateTime"]) {
        var starttime = Date.parse(cal2[i]["start"]["dateTime"]);
        var endtime = Date.parse(cal2[i]["end"]["dateTime"]);
        parsed.push({ start: starttime, end: endtime }); //date.parse is in UTC (so convert to timezone later)
      }
    }
  }   
    return parsed;

    
}


const findFreeTimes = (cal1, cal2) => {

    if (!cal1 && !cal2){
        return null;
    }
    var times = findBusyTimes(cal1, cal2)

    
    var now = new Date();
    var morning;
    var evening;
    if (now.getHours() > 12) {
      //then it is after 12pm so find times for 2 days from now
      morning = new Date(); //set the morning as 2 days from now
      morning.setDate(now.getDate() + 2);
      morning.setHours(8);
      morning.setMinutes(0);
      morning.setSeconds(0);    
      morning.setMilliseconds(0);   
      evening = new Date(); //set the morning as 2 days from now
      evening.setDate(now.getDate() + 2);
      evening.setHours(20);
      evening.setMinutes(0);
      evening.setSeconds(0);    
      evening.setMilliseconds(0);
    } else {
      //we're somewhere before 12pm on the day so
      morning = new Date(); //set the morning as 2 days from now
      morning.setDate(now.getDate());
      morning.setHours(8);
      morning.setMinutes(0);
      morning.setSeconds(0);    
      morning.setMilliseconds(0);   
      evening = new Date(); //set the morning as 2 days from now
      evening.setDate(now.getDate());
      evening.setHours(20);
      evening.setMinutes(0);
      evening.setSeconds(0);    
      evening.setMilliseconds(0);
    }   
    var parsed = [{ start: Date.parse(morning), end: Date.parse(evening) }];
    for (i = 0; i < times.length; i++) {
      for (k = 0; k < parsed.length; k++) {
        if (parsed[k].end < times[i].start) {
          continue;
        }
        if (parsed[k].start > times[i].end) {
          // if the time block starts after the end of the free block the ignore
          continue;
        }
        if (
          parsed[k].start < times[i].start && // the event is inside the free block
          parsed[k].end > times[i].end
        ) {
          //the end of event is inside free block
          //if the times not free in question is within the block currently free
          parsed.push({ start: times[i].end, end: parsed[k].end }); //then split the array into two arrays with the original having the original start and new end,
          //then the other one should be end of the event and end of current one
          parsed[k].end = times[i].start; //then the original
        } else if (
          parsed[k].start >= times[i].start && // this means the event starts before the current bracket of free time
          parsed[k].end >= times[i].end //but the end of the free bracket happens after the time not free
        ) {
          //half of the event is the free time
          parsed[k].start = times[i].end; //then the start of the event is now later
        } else if (
          parsed[k].start <= times[i].start &&
          parsed[k].end <= times[i].end
        ) {
          parsed[k].end = times[i].start; //then the end of the event is now earlier
        }
        if (parsed[k].end === parsed[k].start) {
          parsed.splice(k, 1);
        }
      }
    }
    return parsed;


}



module.exports = {
    findFreeTimes
}