export const RaceTitleVariants = [
  'BORDUR',
  'À Bloc',
  'Dans la Bordure',
  'La Grande Échappée',
  'Bec de Selle',
  'Coup de Bordure'
];

export const UIConfig = {
  titleVariant: 'BORDUR',
  subtitle: 'Préparer la course',
  raceTheme: 'poster',
  animationSpeed: 1
};

export function getRaceHeaderTitle(variant = UIConfig.titleVariant) {
  return RaceTitleVariants.includes(variant) ? variant : RaceTitleVariants[0];
}
