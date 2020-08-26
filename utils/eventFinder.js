/*
 * @param-- cal1, cal2 are two sets of events, one from the requestor, one from the attendee :
 */
const findBusyTimes = (cal1, cal2, offset) => {
  var parsed = [];
  var now = new Date();

  if (cal1) {
    //console.log("USER 1");
    for (i = 0; i < cal1.length; i++) {
      if (cal1[i]["start"]["dateTime"]) {
        if (
          new Date(cal1[i]["start"]["dateTime"]).getDate() - now.getDate() ===
          offset
        ) {
          var starttime = Date.parse(cal1[i]["start"]["dateTime"]);
          var endtime = Date.parse(cal1[i]["end"]["dateTime"]);
          parsed.push({ start: starttime, end: endtime }); //date.parse is in UTC (so convert to timezone later)
        }
      }
    }
  }
  if (cal2) {
    //console.log("USER 2");
    for (i = 0; i < cal2.length; i++) {
      //this gets all the start and end dates of the time
      if (cal2[i]["start"]["dateTime"]) {
        if (
          new Date(cal2[i]["start"]["dateTime"]).getDate() - now.getDate() ===
          offset
        ) {
          var starttime = Date.parse(cal2[i]["start"]["dateTime"]);
          var endtime = Date.parse(cal2[i]["end"]["dateTime"]);
          parsed.push({ start: starttime, end: endtime }); //date.parse is in UTC (so convert to timezone later)
        }
      }
    }
  }
  return parsed;
};

const findFreeTimes = (cal1, cal2, offset) => {
  if (!cal1 && !cal2) {
    return null;
  }
  var times = findBusyTimes(cal1, cal2, offset);

  var now = new Date();
  var morning;
  var evening;

  //get the time zone offsets to know which hours to gate by

  //console.log(parseInt(propdata2[0]["start"]["dateTime"].substring(19, 22)));
  let timezone1 = null;
  let timezone2 = null;
  if (cal1) {
    if (cal1[0]["start"]["dateTime"].substring(19, 20) == "Z") {
      timezone1 = 0;
    } else {
      timezone1 = parseInt(cal1[0]["start"]["dateTime"].substring(19, 22));
    }
    //console.log(timezone1);
  }

  if (cal2) {
    if (cal2[0]["start"]["dateTime"].substring(19, 20) == "Z") {
      timezone2 = 0;
    } else {
      timezone2 = parseInt(cal2[0]["start"]["dateTime"].substring(19, 22));
    }
    //console.log(timezone2);
  }

  //then it is after 12pm so find times for 2 days from now
  morning = new Date(); //set the morning as 2 days from now
  evening = new Date(); //set the morning as 2 days from now
  morning.setDate(now.getDate() + offset);
  // ideally want to go from 9 to 17
  if (timezone1 - timezone2 > 0) {
    morning.setHours(9 + (timezone1 - timezone2));
    evening.setHours(17);
  } else {
    morning.setHours(9);
    evening.setHours(17 + timezone1 - timezone2);
  }
  morning.setMinutes(0);
  morning.setSeconds(0);
  morning.setMilliseconds(0);
  evening.setDate(now.getDate() + offset);

  evening.setMinutes(0);
  evening.setSeconds(0);
  evening.setMilliseconds(0);

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

  // now that the time slots where we're free were found, break them up into 30 minute increments

  let openslots = [];
  for (slots = 0; slots < parsed.length; slots++) {
    if (parsed[slots].start % 1800000 != 0) {
      parsed[slots].start += 1800000 - (parsed[slots].start % 1800000); //round up to the nearest half hour
    }
    let tracker = parsed[slots].start;
    while (parsed[slots].end - tracker >= 1800000) {
      openslots.push({ start: tracker, end: tracker + 1800000 });
      tracker += 1800000;
    }
  }
  return openslots;
};



module.exports = {
    findFreeTimes
}