import { ProductDemoSteps } from "./product-demo-steps";
import { ProductDemoViewer } from "./product-demo-viewer";

export function ProductDemo() {
  return (
    <>
      {/* Part 1 — narrative steps */}
      <section className="py-24 bg-secondary/30" id="demo-steps">
        <div className="container mx-auto px-4">
          <ProductDemoSteps />
        </div>
      </section>

      {/* Part 2 — live demos */}
      <section className="py-24 bg-background border-t border-border" id="demo-viewer">
        <div className="container mx-auto px-4">
          <ProductDemoViewer />
        </div>
      </section>
    </>
  );
}
