# Commit guard substitution evidence

Date: 2026-11-09

addedPaths fails closed for executing substitutions hiding git add: cases cover $(), backticks, nested, git -C, quoted add, double-quoted substitution; single-quoted/escaped/no-add stay open (10 unit assertions + 1 commitCheck integration case).
Node 303/303; parity ok (shared core unchanged); CLI 13/13; srg 11/11.
Tech-debt commit-race row stays Open with the substitution case resolved and wrapper-script forms as the residual.
