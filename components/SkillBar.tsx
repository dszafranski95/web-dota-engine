// components/SkillBar.tsx
import React from 'react';
import styles from './SkillBar.module.css';

interface SkillBarProps {
  spellCooldowns: { [key: number]: number };
}

const SkillBar: React.FC<SkillBarProps> = ({ spellCooldowns }) => {
  const formatCooldown = (cooldown: number) => {
    return (cooldown / 1000).toFixed(1); // Konwersja na sekundy z jednym miejscem po przecinku
  };

  const maxCooldowns: { [key: number]: number } = {
    1: 0,      // Zakładam, że czar 1 nie ma cooldownu
    2: 5000,   // 5 sekund
    3: 15000,  // 15 sekund
    4: 60000,  // 60 sekund
  };

  const spellIcons: { [key: number]: string } = {
    1: '/textures/fire.png',
    2: '/textures/snow.png',
    3: '/textures/lightning.png',
    4: '/textures/poison.png',
  };

  return (
    <div className={styles.skillBar}>
      {[1, 2, 3, 4].map((spellNumber) => {
        const cooldown = spellCooldowns[spellNumber] || 0;
        const maxCooldown = maxCooldowns[spellNumber];
        const isOnCooldown = cooldown > 0 && maxCooldown > 0;

        return (
          <div
            key={spellNumber}
            className={`${styles.skill} ${isOnCooldown ? styles.cooldown : ''}`}
          >
            <span className={styles.spellNumber}>{spellNumber}</span>
            <img
              src={spellIcons[spellNumber]}
              alt={`Spell ${spellNumber}`}
              className={styles.spellIcon}
            />
            {isOnCooldown && (
              <>
                <div
                  className={styles.cooldownOverlay}
                  style={{
                    height: `${(cooldown / maxCooldown) * 100}%`,
                    transition: `height ${cooldown / 1000}s linear`,
                  }}
                ></div>
                <div className={styles.cooldownText}>
                  {Math.ceil(cooldown / 1000)}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SkillBar;
