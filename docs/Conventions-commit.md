# Spécification Conventional Commits v1.0.0

## Résumé

La spécification **Conventional Commits** est une convention légère appliquée aux messages de commit. Elle définit un ensemble de règles pour créer un historique de commit explicite, facilitant ainsi la création d'outils automatisés. Cette convention s'aligne sur **SemVer**, en identifiant les fonctionnalités (**features**), les corrections (**fixes**) et les modifications majeures (**breaking changes**) dans les messages.

La structure d'un message de commit doit ressembler à ceci :

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

---

## Spécification

Les mots-clés "MUST" (DOIT), "MUST NOT" (NE DOIT PAS), "REQUIRED" (REQUIS), "SHALL" (DEVRA), "SHALL NOT" (NE DEVRA PAS), "SHOULD" (DEVRAIT), "SHOULD NOT" (NE DEVRAIT PAS), "RECOMMENDED" (RECOMMANDÉ), "MAY" (PEUT) et "OPTIONAL" (OPTIONNEL) doivent être interprétés comme décrit dans la [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt).

1. Chaque message de commit **MUST** être préfixé d'un **type**, composé d'un nom (ex: `feat`, `fix`), suivi d'un **scope** optionnel, d'un point d'exclamation optionnel, d'un deux-points et d'un espace REQUIS.
2. Le type `feat` **MUST** être utilisé lorsqu'un commit ajoute une nouvelle fonctionnalité (*feature*).
3. Le type `fix` **MUST** être utilisé lorsqu'un commit apporte une correction de bug (*bug fix*).
4. Un **scope** **MAY** être fourni après le type. Il doit s'agir d'un nom décrivant une section du code entre parenthèses (ex: `fix(parser):`).
5. Une **description** **MUST** suivre immédiatement l'espace après le préfixe type/scope. Il s'agit d'un résumé court des modifications.
6. Un **body** plus long **MAY** être ajouté après la description. Il **MUST** commencer après une ligne vide.
7. Un ou plusieurs **footers** **MAY** être ajoutés après une ligne vide après le body. Chaque footer **MUST** contenir un jeton (*word token*), suivi du séparateur `: ` ou ` #`, puis d'une valeur textuelle.
8. Le jeton d'un footer **MUST** utiliser `-` à la place des espaces (ex: `Reviewed-by`). Exception : `BREAKING CHANGE` peut être utilisé comme jeton.
9. La valeur d'un footer **MAY** contenir des espaces et des retours à la ligne ; l'analyse s'arrête au prochain jeton de footer.
10. Les modifications majeures (**breaking changes**) **MUST** être indiquées soit par un `!` dans le préfixe type/scope, soit par une entrée dans le footer.
11. En footer, un breaking change **MUST** commencer par le jeton en majuscules `BREAKING CHANGE:`, suivi d'une description.
12. Dans le préfixe, le breaking change est marqué par un `!` juste avant le deux-points (ex: `feat(api)!: rewrite login`). Si `!` est présent, `BREAKING CHANGE:` en footer est optionnel.
13. Des types autres que `feat` et `fix` **MAY** être utilisés (ex: `build:`, `chore:`, `ci:`, `docs:`, `style:`, `refactor:`, `perf:`, `test:`).
14. Les éléments des Conventional Commits **MUST NOT** être sensibles à la casse, sauf pour `BREAKING CHANGE` qui **MUST** être en majuscules.
15. `BREAKING-CHANGE` **MUST** être considéré comme un synonyme de `BREAKING CHANGE`.