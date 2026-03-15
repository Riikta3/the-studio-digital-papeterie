import { ProductDemoViewer } from "./product-demo-viewer";

export function ProductDemo() {
  return (
    <section className="py-24 bg-background border-t border-border overflow-x-hidden" id="demo-viewer">
      <div className="container mx-auto px-4">
        <ProductDemoViewer />
      </div>
    </section>
  );
}
