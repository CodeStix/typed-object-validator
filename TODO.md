-   typed object keys:
    ```
    export interface TestRegistrationsMarkRequest {
      testId: number;
      mark: {
          [Key in RegistrationStatus]?: number[];
      };
    }
    ```
-   schema clone
-   resolve `UndefinedToOptional` helper type in nested objects
-   `NumberSchema.float()` unit tests
-   way to set default messages at runtime
-   create schema object instance helper
-   unit test multidimensional array
-   async
-   transformation unit tests
