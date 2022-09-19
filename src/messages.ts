export default {
  voteMessage: `
Nouveau vote d'assemblée !
> *Votez en cliquant sur les boutons ci dessous. Les procurations sont automatiquement ajoutées.*
> *Vous ne pouvez pas voter blanc pour tous les votes de l'assemblée.*

:white_check_mark: {yesCount} ({yesPercentage}%) / :x: {noCount} ({noPercentage}%) / :flag_white: {blankCount} ({blankPercentage}%)
*Votants : {totalVoters} / Votes : {totalVotes}*

**{content}**
`,
  voteMessageResult: (yesCount: number, noCount: number, blankCount: number) => `
À la question suivante :
**{content}**

**${yesCount || 'aucune'}** personne${yesCount > 1 ? 's ont' : ' a'} répondu **pour :white_check_mark:** ({yesPercentage}%)
**${noCount || 'aucune'}** personne${noCount > 1 ? 's ont' : ' a'} répondu **contre :x:** ({noPercentage}%)
**${blankCount || 'aucune'}** personne${blankCount > 1 ? 's ont' : ' a'} répondu **blanc :flag_white:** ({blankPercentage}%)
(*Votants : {totalVoters} / Votes comptabilisés : {totalVotes}*)

__Le vote est donc {result}__
`,
  results: {
    yes: '**accepté :white_check_mark: !**',
    no: '**refusé :x: !**',
    blank: "**invalide**. Un nouveau vote peut être organisé durant cette même séance, s'il est également invalidé, alors le sujet est considéré comme non-traité et pourra être présenté de nouveau au cours d'une nouvelle séance.",
  },
} as const;
