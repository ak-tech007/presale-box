import moment from 'moment';
import { useState, useEffect } from 'react';

const CountdownTimer = () => {
  const [targetDate, setTargetDate] = useState(moment().add(1, 'day')); 
  const [now, setNow] = useState(moment());
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTargetDate(moment(targetDate).subtract(1, 'second')); 
      setNow(moment());
      const diff = targetDate.diff(now, 'seconds');
      setDays(Math.floor(diff / 86400));
      setHours(Math.floor((diff % 86400) / 3600));
      setMinutes(Math.floor((diff % 3600) / 60));
      setSeconds(diff % 60);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [targetDate]);

  return (
      <div className="mb-4 flex justify-between rounded-xl border-4 text-white border-black bg-[rgb(111,234,255)] p-4 text-center text-lg font-extrabold">
        <div>
          <p className="text-xl">DAYS</p>
          <p className="text-xl">{days < 10 ? `0${days}` : days}</p>
          
        </div>
        <div>
          <p className="text-xl">HOURS</p>
          <p className="text-xl">{hours < 10 ? `0${hours}` : hours}</p>
        </div>
        <div>
          <p className="text-xl">MINUTES 1</p>
          <p className="text-xl">{minutes < 10 ? `0${minutes}` : minutes}</p>
        </div>
        <div>
          <p className="text-xl">SECONDS</p>
          <p className="text-xl">{seconds < 10 ? `0${seconds}` : seconds}</p>
        </div>
     </div>
      
   
  );
};

export default CountdownTimer;