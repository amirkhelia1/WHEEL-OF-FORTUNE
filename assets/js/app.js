function spinToIndex(targetIndex) {
  const segmentAngle = 36; 
  const randomOffset = Math.floor(Math.random() * 10) - 5;
  const minSpin = 1800; 
  

  const targetAngle = (targetIndex * segmentAngle);
  
 
  const currentMod = currentRotation % 360;
  
  
  let distance = targetAngle - currentMod + randomOffset;
  if (distance < 0) distance += 360;
  

  const totalSpin = minSpin + distance;
  currentRotation += totalSpin;
  
  wheel.style.transform = `rotate(-${currentRotation}deg)`;
}
