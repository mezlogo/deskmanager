# example

Example for both: how to write handlers AND how to write features

There are two handlers:
- `greet`: prints `hello, <value>!` for each arg
- `aloha`: prints `aloha, <value>!` for each arg

Features:
- `obj_notation`: shows most common usage
- `arr_notation`: shows how to use same handler more than one times
- `order_notation`: shows how to reorder execution

Examples:
- show handlers: `deskmanager --handler-dir example/handlers list-handlers`
- show features: `deskmanager --feature-dir example/features list-features`
- execute `obj_notation`: `deskmanager --feature-dir example/features --handler-dir example/handlers --feature-name obj_notation diff`
- execute `arr_notation`: `deskmanager --feature-dir example/features --handler-dir example/handlers --feature-name arr_notation diff`
- execute `order_notation`: `deskmanager --feature-dir example/features --handler-dir example/handlers --feature-name order_notation diff`
